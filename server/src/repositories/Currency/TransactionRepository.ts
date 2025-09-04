import { knex } from "../../db/index.js";
import { CurrencyLedgerRow, TransactionEntryRow, TransactionRow } from "../../db/tables.js";
import { CurrencySource, CurrencyType } from "../../integrations/currency/types.js";

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

export async function getChargeSplitForTransactionById(id: number): Promise<{ target: number, credit: number, atrium: number } | undefined> {
    const entries = await getTransactionEntriesByTransactionId(id);
    if (entries.length == 0) {
        return undefined;
    }
    const sum = entries.reduce((acc, row) => row.amount + acc, 0);
    const charges = await getCurrencyLedgerEntriesForTransactionById(id);
    if (charges.length == 0) {
        return undefined;
    }

    let aSum = 0;
    let cSum = 0;
    charges.forEach(val => {
        if (val.currencyType == CurrencyType.Atrium) {
            aSum += val.amount;
        } else if (val.currencyType == CurrencyType.Credit) {
            cSum += val.amount;
        }
    })

    return { target: sum, atrium: aSum, credit: cSum };

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