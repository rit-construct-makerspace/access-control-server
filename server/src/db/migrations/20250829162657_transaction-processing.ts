import type { Knex } from "knex";
import { CurrencySource } from "../../integrations/currency/types.js";
import { getCurrencyLedgerEntries } from "../../repositories/Currency/CurrencyLedgerRepository.js";


export async function up(knex: Knex): Promise<void> {
    if (await knex.schema.hasTable("Transactions")){
        // table already exists
        return;
    }
    await knex.schema.createTable("Transactions", (t)=>{
        t.increments("id").primary();
        t.integer("accountID").references("id").inTable("CurrencyAccounts").notNullable();
        t.text("origin").notNullable();
        t.jsonb("description").notNullable();
        t.integer("outstandingCharge").notNullable();
        t.integer("printerJobId").nullable();
        const allOrigins = [CurrencySource.Printers, CurrencySource.Store, CurrencySource.Website, CurrencySource.Unknown].map(s => `'${s}'`);
        t.check(`?? in (${allOrigins.join(",")})`, ["origin"])
    });
    await knex.schema.createTable("TransactionEntries", (t)=>{
        t.increments("id").primary();
        t.integer("transactionID").references("id").inTable("Transactions");
        t.integer("amount").notNullable();
        t.text("description").notNullable();
    });
    await knex("CurrencyLedger").delete("*");

    await knex.schema.alterTable("CurrencyLedger", (t) => {
        t.dropColumns("atriumAmount", "printerJobId", "atriumTerminal");
        t.renameColumn("creditAmount", "amount");
        t.integer("transactionEntryId").references("id").inTable("TransactionEntries");
    })
}


export async function down(knex: Knex): Promise<void> {
    throw "This is a destructive action, cannot go down"
}

