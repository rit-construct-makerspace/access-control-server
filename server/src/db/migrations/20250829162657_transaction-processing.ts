import type { Knex } from "knex";
import { CurrencySource, CurrencyType } from "../../integrations/currency/types.js";


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
        t.datetime("dateTime").notNullable();
        t.integer("transactionID").references("id").inTable("Transactions");
        t.integer("amount").notNullable();
        t.text("description").notNullable();
    });
    await knex("CurrencyLedger").delete("*");

    await knex.schema.alterTable("CurrencyLedger", (t) => {
        t.dropColumns("source", "atriumAmount", "printerJobId", "atriumTerminal");
        t.renameColumn("creditAmount", "amount");
        t.integer("transactionEntryId").references("id").inTable("TransactionEntries");
        t.text("currencyType").notNullable();
        const allCurrencies = [CurrencyType.Atrium, CurrencyType.Credit].map(s => `'${s}'`);
        t.check(`"currencyType" in (${allCurrencies.join(",")})`, [], "currencyTypeCheck")
    })
}


export async function down(knex: Knex): Promise<void> {
    throw "This is a destructive action, cannot go down"
}

