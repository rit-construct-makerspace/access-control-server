/**
 * Multi-part charges
 * 
 */

import { CurrencySource, MakeMoneyError } from "./types.js"
import * as TransactionRepo from "../../database/repositories/Currency/TransactionRepository.js"
import * as Currency from "./currency.js"
import { send_transaction_email } from "../email/email.js";

/**
 * Check if a charge qualifies for the outstanding charge exception
 * A full serve 3d print gets charged as a tiny price until a skilled operator can quote the job.
 * Once the skilled operator quotes the job, the price is adjusted to the actual price that the user will be charged
 * @param cents the amount to charge (delta where + is refund to account, - is take from account)
 * @returns true if this transaction counts for the outstanding charge exception
 */
function isOutstandingCharge(cents: number) {
    return cents >= -3 && cents < 0;
}
/**
 * Create a new transaction
 * @param accountId the account that this transaction is working against
 * @param initialDeltaCents the initial price (subject to outstanding charge exception)
 * @param source the source of the transaction (printers, store, website)
 * @param description a description of this transaction
 * @param options general options detailing what this transction is for
 * @returns true if the transaction was created successfully and charged (or the outstanding charge exception applied)
 */
export async function NewTransaction(accountId: number, initialDeltaCents: number, source: CurrencySource, description: { text: string, data: unknown }, options: { printerJobId: number }): Promise<boolean | MakeMoneyError> {
    let outstanding = 0;
    if (isOutstandingCharge(initialDeltaCents)) {
        // this is an outstanding one, dont charge yet
        outstanding = initialDeltaCents;
    }
    const tid = await TransactionRepo.createTransaction(accountId, source, description, outstanding, options.printerJobId);
    if (tid === undefined) {
        console.error("Currency: Could not create new transaction");
        return MakeMoneyError.SomethingElse;
    }
    if (isOutstandingCharge(initialDeltaCents)) {
        return true;
    }
    // If this transaction doesnt have outstanding charge, add the original cost as an update to charge
    const res = await UpdateTransaction(tid, initialDeltaCents, description.text)
    return res
}

/**
 * Add/Subtract to the total price
 * @param transactionID the transaction to modify
 * @param deltaCents the amount to add/subtract to the total price (+ is give money to user (refund/less expensive), - is take money from user (charge/more expensive))
 * @param reason why this adjustment is happening
 * @returns true/false for success or MakeMoneyError if there was an issue operating
 */
export async function UpdateTransaction(transactionID: number, deltaCents: number, reason: string): Promise<MakeMoneyError | boolean> {
    // check if there is outstanding charges
    const parent = await TransactionRepo.getTransactionById(transactionID);
    if (parent === undefined) {
        throw Error(`Could not find parent transaction for id: ${transactionID}`);
    }

    let centsToCharge = deltaCents;
    if (parent.outstandingCharge) {
        centsToCharge += parent.outstandingCharge;
    }

    const entryId = await TransactionRepo.createTransactionUpdate(parent.id, centsToCharge, reason)
    if (entryId === undefined) {
        console.error("Currency: Failed to create transaction ID");
        return MakeMoneyError.SomethingElse;
    }
    if (centsToCharge == 0) {
        // don't need to do anything
        return true;
    }

    // If here, have to modify price. In order to handle refunds, refund everything, recharge
    // get last update
    const lastCharges = await TransactionRepo.getLastChargesForTransactionById(transactionID);
    if (lastCharges != undefined) {
        // If we have charged the user money last time, this will be negative
        // If it is positive, we have somehow paid them
        const deltaForThisTransaction = (lastCharges.atrium?.amount ?? 0) + (lastCharges.credit?.amount ?? 0)
        if (centsToCharge + deltaForThisTransaction > 0) {
            // recharge would give the user money (something fishy)
            console.error(`Currency: Caught fraudulent refund before refund. Not gonna refund it. Probably needs manual rectification. tid: ${transactionID} asking for ${centsToCharge}, only ever spent ${-deltaForThisTransaction}`)
            return false;
        }
        const res = await Currency.refundChargeGroup(lastCharges, parent, entryId);
        if (typeof (res) == 'string') {
            console.error(`Currency: Error occured while trying to refund to recharge. tid: ${parent.id}, teid: ${entryId}, err: ${res}`);
            return res
        }
        // update amount to charge based on how much was already refunded/spent
        centsToCharge = deltaForThisTransaction + centsToCharge;
    }
    if (centsToCharge > 0) {
        console.error(`Currency: Illegal attempt to refund more than spent: tid:${transactionID}, tried to adjust ${centsToCharge} with reason ${reason}`)
        return false;
    }
    // charge new amount
    const chargeResult = await Currency.chargeAccount(parent.accountID, -centsToCharge, parent.origin, reason, entryId);
    if (typeof (chargeResult) == 'string') {
        // was an error
        console.error(`Currency: Could not charge account tid: ${parent.id}, teid: ${entryId}, err: ${chargeResult} `);
        return chargeResult;
    }
    if (!chargeResult) {
        return false;
    }

    await TransactionRepo.removeOutstandingChargeOnTransactionIfAvailable(transactionID);
    send_transaction_email(transactionID);
    return true;
}