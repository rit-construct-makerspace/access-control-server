/**
 * Multi-part charges
 * 
 */

import { CurrencySource } from "./types.js"
import * as TransactionRepo from "../../repositories/Currency/TransactionRepository.js"
import * as Currency from "./currency.js"

function isOutstandingCharge(cents: number) {
    return cents <= 3;
}

export async function NewTransaction(accountId: number, cents: number, source: CurrencySource, description: { text: string, data: unknown }, options: { printerJobId: number }): Promise<number | undefined> {
    // await Transaction
    let outstanding = 0;
    if (isOutstandingCharge(cents)) {
        // this is an outstanding one, dont charge yet
        outstanding = 1;
    }
    const tid = await TransactionRepo.createTransaction(accountId, source, description, outstanding, options.printerJobId);
    if (isOutstandingCharge(cents)) {
        return;
    }
    // If this transaction doesnt have outstanding charge, add the original cost as an update to charge
    await UpdateTransaction(tid, cents, "Initial Charge")
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
        centsToCharge -= parent.outstandingCharge;
    }

    let amounts = { atrium: 0, credit: 0 };

    if (centsToCharge > 0) {
        const split = await TransactionRepo.getChargeSplitForTransactionById(transactionID);
        if (split == null) {
            const res = await Currency.refundCreditAccount(parent.accountID, centsToCharge, parent.origin, reason)
            if (typeof res == "boolean" && res == true) {
                amounts = { atrium: 0, credit: centsToCharge };
            } else if (typeof res == "string") {
                return res;
            }
        } else {
            const res = await Currency.refundAccountSplitting(parent.accountID, centsToCharge, split, reason, transactionID)
            if (typeof res == "string") {
                return res;
            } else {
                amounts = res;
            }
        }
    } else {
        const amt = Math.abs(centsToCharge);
        const res = await Currency.chargeAccount(parent.accountID, amt, parent.origin, reason, transactionID);
        if (typeof res == "string") {
            return res;
        } else {
            // negate amounts since we are charging
            amounts = { atrium: -res.atrium, credit: -res.credit };
        }
    }

    await TransactionRepo.removeOutstandingChargeOnTransactionIfAvailable(transactionID);
    return amounts;
}