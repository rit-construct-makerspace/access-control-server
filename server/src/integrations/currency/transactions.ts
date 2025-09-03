/**
 * Multi-part charges
 * 
 */

import { CurrencySource } from "./types.js"
import * as TransactionRepo from "../../repositories/Currency/TransactionRepository.js"
import * as Currency from "./currency.js"
import { send_transaction_email } from "../email/email.js";
import { getAccountOwner } from "../../repositories/Currency/CurrencyAccountsRepository.js";

function isOutstandingCharge(cents: number) {
    return cents >= -3 && cents < 0;
}

export async function NewTransaction(accountId: number, initialDeltaCents: number, source: CurrencySource, description: { text: string, data: unknown }, options: { printerJobId: number }): Promise<number | Currency.MakeMoneyError> {
    let outstanding = 0;
    if (isOutstandingCharge(initialDeltaCents)) {
        // this is an outstanding one, dont charge yet
        outstanding = initialDeltaCents;
    }
    const tid = await TransactionRepo.createTransaction(accountId, source, description, outstanding, options.printerJobId);
    if (tid == undefined) {
        console.error("Currency: Could not create new transaction");
        return Currency.MakeMoneyError.SomethingElse;
    }
    if (isOutstandingCharge(initialDeltaCents)) {
        return 0;
    }
    // If this transaction doesnt have outstanding charge, add the original cost as an update to charge
    const res = await UpdateTransaction(tid, initialDeltaCents, description.text)
    if (typeof res !== "string") {
        return res.atrium + res.credit;
    }
    return res
}

/**
 * 
 * @param transactionID 
 * @param deltaCents 
 * @param reason 
 * @returns undefined if the amounts were charged
 */
export async function UpdateTransaction(transactionID: number, deltaCents: number, reason: string): Promise<Currency.MakeMoneyError | { atrium: number, credit: number }> {
    // check if there is outstanding charges
    const parent = await TransactionRepo.getTransactionById(transactionID);
    if (parent == null) {
        throw Error(`Could not find parent transaction for id: ${transactionID}`);
    }

    let centsToCharge = deltaCents;
    if (parent.outstandingCharge) {
        centsToCharge += parent.outstandingCharge;
    }
    let split = await TransactionRepo.getChargeSplitForTransactionById(transactionID);

    const entryId = await TransactionRepo.createTransactionUpdate(parent.id, centsToCharge, reason)
    if (entryId == null) {
        console.error("Currency: Failed to create transaction ID");
        return Currency.MakeMoneyError.SomethingElse;
    }
    let amounts = { atrium: 0, credit: 0 };

    if (centsToCharge > 0) {
        if (split == null) {
            const res = await Currency.refundCreditAccount(parent.accountID, centsToCharge, parent.origin, reason, entryId)
            if (typeof res == "boolean" && res == true) {
                amounts = { atrium: 0, credit: centsToCharge };
            } else if (typeof res == "string") {
                return res;
            }
        } else {
            // modify split so we never refund more than we've taken
            if (split.atrium >= 0) { split.atrium = 0 };
            if (split.credit >= 0) { split.credit = 0 };
            let positiveSplit = { atrium: Math.abs(split.atrium), credit: Math.abs(split.credit) }; // we want the splits positive for the amount we can use

            const res = await Currency.refundAccountSplitting(parent.accountID, centsToCharge, parent.origin, positiveSplit, reason, entryId)
            if (typeof res == "string") {
                return res;
            } else {
                amounts = res;
            }
        }
    } else {
        const amt = Math.abs(centsToCharge);
        const res = await Currency.chargeAccount(parent.accountID, amt, parent.origin, reason, entryId);
        if (typeof res == "string") {
            return res;
        } else {
            // negate amounts since we are charging
            amounts = { atrium: -res.atrium, credit: -res.credit };
        }
    }

    await TransactionRepo.removeOutstandingChargeOnTransactionIfAvailable(transactionID);
    send_transaction_email()
    return amounts;
}