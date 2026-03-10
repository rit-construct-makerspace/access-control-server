import { knex } from "../../db/index.js";
import { CurrencyLedgerRow, TransactionEntryRow, TransactionRow } from "../../db/tables.js";
import { CurrencySource, CurrencyType } from "../../integrations/currency/types.js";
import { createUnassocaitedAuditLog } from "../AuditLogs/AuditLogRepository.js";

/**
 * Create the parent element of a transaction
 * YOU PROBABLY SHOULDNT BE USING THIS DIRECTLY. THIS DOESNT ACTUALLY DO ANY CHARGING JUST RECORDS TO THE DB
 * TO PROCESS TRANSACTIONS, USE transaction.ts
 * @param accountID the account that the transaction is for
 * @param origin what is causing this transaction
 * @param description description (human readable and json data) for transaction
 * @param outstandingCharge number of cents outstanding (to be charged at the first update)
 * @param printerJobId the job id this transaction corresponds to
 * @returns the id of the created transaction or undefined if we couldn't create it
 */
export async function createTransaction(accountID: number, origin: CurrencySource, description: { text: string, data: unknown }, outstandingCharge: number, printerJobId: number): Promise<number | undefined> {
    const rows = await knex("Transactions").insert({ accountID: accountID, origin: origin, outstandingCharge: outstandingCharge, printerJobId, description }).returning("id");
    if (rows.length > 0) {
        return rows[0].id;
    }
    return undefined;
}

/**
 * Fetch a transaction by its id
 * @param id id of transaction
 * @returns a transaction corresponding to that id, or undefined if not found
 */
export async function getTransactionById(id: number): Promise<TransactionRow | undefined> {
    const rows = await knex("Transactions").select("*").where({ id: id });
    if (rows.length > 0) {
        return rows[0];
    }
    return undefined;
}


export async function removeOutstandingChargeOnTransactionIfAvailable(id: number) {
    await knex("Transactions").where({ id: id }).update({ outstandingCharge: 0 })
}

/**
* Fetch a transaction by its printer job id
* @param printerJobId job id of transaction to fetch
* @returns a transaction corresponding to that job id, or undefined if not found
*/
export async function getTransactionByPrinterJobId(printerJobId: number): Promise<TransactionRow | undefined> {
    const rows = await knex("Transactions").select("*").where({ printerJobId });
    if (rows.length > 0) {
        return rows[0];
    }
    return undefined;
}

/**
 * Get all transaction update entries corresponding to a specific transaction
 * @param id the id of the parent transaction
 * @returns list of entries corresponding to that transaction
 */
export async function getTransactionEntriesByTransactionId(id: number): Promise<TransactionEntryRow[]> {
    const entries = await knex("TransactionEntries").where({ transactionID: id }).returning("*").orderBy("dateTime");
    return entries;
}
export async function getCurrencyLedgerEntriesForTransactionById(id: number): Promise<CurrencyLedgerRow[]> {
    return await knex("Transactions as t")
        .leftJoin("TransactionEntries as te", "t.id", 'te.transactionID')
        .leftJoin("CurrencyLedger as cl", "te.id", 'cl.transactionEntryId')
        .where("t.id", "=", id)
        .select("cl.*");
}

export async function getCurrencyLedgerEntriesForTransactionEntryByEntryId(id: number): Promise<CurrencyLedgerRow[]> {
    return await knex("TransactionEntries as te")
        .leftJoin("CurrencyLedger as cl", "te.id", 'cl.transactionEntryId')
        .where("te.id", "=", id)
        .select("cl.*");
}

/**
 * Because we handle refunds by fully giving back then recharging, the last two charges hold the entire price
 * @param transactionId the transaction to recall the charges for
 * @returns a description of the last modification
 */
export async function getLastChargesForTransactionById(transactionId: number): Promise<{ transactionEntryId: number, atrium?: { amount: number, txid: number, currencyLedgerId: number }, credit?: { amount: number, currencyLedgerId: number } } | undefined> {

    type Row = {
        transactionEntryId: number,
        CLID: number,
        currencyType: CurrencyType,
        amount: number,
        atriumRefID: number | null,
        atriumTxId: number | null,
    };
    const rows = await knex("TransactionEntries as te")
        .select(`te.id as transactionEntryId`,
            `cl.id as CLID`,
            `cl.currencyType as currencyType`,
            `cl.amount as amount`,
            `cl.refID as atriumRefId`,
            `cl.atxID as atriumTxId`,
        )
        .leftJoin("CurrencyLedger as cl", "cl.transactionEntryId", "te.id")
        .where("te.transactionID", "=", transactionId)
        .orderBy("te.dateTime", "desc") as Row[];

    const rowsNotIncludingEmptyEntries = rows.filter(r => r.CLID !== null);
    if (rowsNotIncludingEmptyEntries.length == 0) {
        // dont even have the transaction entry (weird and bad)
        return undefined;
    }

    const entryIdWeCareAbout = rowsNotIncludingEmptyEntries[0].transactionEntryId;
    const justLastCharges = rowsNotIncludingEmptyEntries.filter(r => r.amount < 0 && r.transactionEntryId == entryIdWeCareAbout); // we don't want the last refund

    if (justLastCharges.length > 2) {
        // something has gone terribly wrong, we somehow charged 3 times with 2 currencies
        await createUnassocaitedAuditLog(`Strange Currency Bug That You Will Have To Fix Manually. Could not find history for transaction ID: ${transactionId}`, "currency")
        return undefined;
    }
    let atrium: { amount: number, txid: number, currencyLedgerId: number } | undefined = undefined;
    let credit: { amount: number, currencyLedgerId: number } | undefined = undefined;
    for (const cl of justLastCharges) {
        if (cl.currencyType == CurrencyType.Atrium) {
            if (cl.atriumTxId == null) {
                console.error("Currency: Failed to find atrium transaction ID for atrium charge.")
            } else {
                atrium = { amount: cl.amount, currencyLedgerId: cl.CLID, txid: cl.atriumTxId }
            }
        } else if (cl.currencyType == CurrencyType.Credit) {
            credit = { amount: cl.amount, currencyLedgerId: cl.CLID };
        }
    }
    return { transactionEntryId: entryIdWeCareAbout, atrium, credit };
}

/**
 * Create an update for a transaction
 * YOU PROBABLY SHOULDNT BE USING THIS DIRECTLY. THIS DOESNT ACTUALLY DO ANY CHARGING JUST RECORDS TO THE DB
 * TO PROCESS TRANSACTIONS, USE transaction.ts
 * @param transactionID the parent transaction this entry applies to
 * @param amount the amount that this update applies
 * @param description human readable description of the reason for this transaction
 * @returns the id of this transaction entry
 */
export async function createTransactionUpdate(transactionID: number, amount: number, description: string): Promise<number | undefined> {
    const rows = await knex("TransactionEntries").insert({ transactionID, amount, description, dateTime: new Date() }).returning("id");
    if (rows.length > 0) {
        return rows[0].id;
    }
    return undefined;
}