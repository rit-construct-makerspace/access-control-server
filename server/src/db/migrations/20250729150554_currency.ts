import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const currencyAccountsExist = await knex.schema.hasTable("CurrencyAccounts");
    if (currencyAccountsExist) {
        return;
    }

    await knex.schema.createTable("CurrencyAccounts", (t) => {
        t.integer("id").primary();
        t.integer("balance").notNullable().defaultTo(0);
        t.check("?? >= 0", ["balance"]);
    });

    await knex.schema.alterTable("Users", (t) => {
        t.dropColumn("balance");
        t.integer("accountID").references("id").inTable("CurrencyAccounts").nullable();
    });

    const users = await knex("Users").select("id");
    for (let i = 0; i < users.length; i++) {
        const row = await knex("CurrencyAccounts").insert({}).returning("id");
        await knex("Users").where({ id: users[i].id }).update({ accountID: row[0].id });
    }

    await knex.schema.alterTable("Users", (t) => {
        t.dropNullable("accountID");
    });

    await knex.schema.createTable("Organizations", (t) => {
        t.integer("id").primary();
        t.string("username").notNullable().unique();
        t.string("displayname").nullable();
        t.integer("accountID").references("id").inTable("CurrencyAccounts").notNullable();
    });

    await knex.schema.createTable("CurrencyLedger", (t) => {
        t.integer("id").primary();
        t.timestamp("date").notNullable().defaultTo(knex.fn.now());
        t.integer("accountID").references("id").inTable("CurrencyAccounts").notNullable();
        t.integer("amount").notNullable();
        t.string("source").notNullable();
        t.string("description").notNullable().defaultTo("");
        t.bigInteger("atxID").nullable();
        t.check("?? >= 0", ["atxID"]);
        t.bigInteger("refID").nullable();
        t.check("?? >= 0", ["refID"]);
    });
}


export async function down(knex: Knex): Promise<void> {
}

