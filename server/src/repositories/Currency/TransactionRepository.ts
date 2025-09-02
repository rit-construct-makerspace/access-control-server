import { knex } from "../../db/index.js";
import { CurrencyLedgerRow, TransactionEntryRow, TransactionRow } from "../../db/tables.js";
import { CurrencySource, CurrencyType } from "../../integrations/currency/types.js";

/**
 * Create the parent element of a transaction
 * YOU PROBABLY SHOULDNT BE USING THIS DIRECTLY. THIS DOESNT ACTUALLY DO ANY CHARGING JUST RECORDS TO THE DB
 * TO PROCESS TRANSACTIONS, USE transaction.ts
 * @param accountID 
 * @param origin 
 * @param description 
 * @param outstandingCharge 
 * @param printerJobId 
 * @returns 
 */
export async function createTransaction(accountID: number, origin: CurrencySource, description: { text: string, data: unknown }, outstandingCharge: number, printerJobId: number): Promise<number | undefined> {
    const rows = await knex("Transactions").insert({ accountID: accountID, origin: origin, outstandingCharge: outstandingCharge, printerJobId, description }).returning("id");
    if (rows.length > 0) {
        return rows[0].id;
    }
    return undefined;
}

export async function getTransactionById(id: number): Promise<TransactionRow | undefined> {
    const rows = await knex("Transactions").select("*").where({ id });
    if (rows.length > 0) {
        return rows[0];
    }
    return undefined;
}

export async function removeOutstandingChargeOnTransactionIfAvailable(id: number) {
    await knex("Transactions").where({ id: id }).update({ outstandingCharge: 0 })
}


export async function getTransactionByPrinterJobId(printerJobId: number): Promise<TransactionRow | undefined> {
    const rows = await knex("Transactions").select("*").where({ printerJobId });
    if (rows.length > 0) {
        return rows[0];
    }
    return undefined;
}

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

export async function getChargeSplitForTransactionById(id: number): Promise<{ target: number, credit: number, atrium: number } | undefined> {
    const entries = await getTransactionEntriesByTransactionId(id);
    const sum = entries.reduce((acc, row) => row.amount + acc, 0);
    const charges = await getCurrencyLedgerEntriesForTransactionById(id);

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