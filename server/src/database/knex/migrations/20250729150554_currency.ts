import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const currencyAccountsExist = await knex.schema.hasTable("CurrencyAccounts");
    if (currencyAccountsExist) {
        return;
    }

    await knex.schema.createTable("CurrencyAccounts", (t) => {
        t.increments("id").primary();
        t.integer("balance").notNullable().defaultTo(0);
        t.check("?? >= 0", ["balance"]);
    });

    await knex.schema.alterTable("Users", (t) => {
        t.dropColumn("balance");
        t.integer("accountID").references("id").inTable("CurrencyAccounts").nullable();
        t.string("atriumToken").nullable();
    });

    const users = await knex("Users").select("id");
    for (let i = 0; i < users.length; i++) {
        // log every 5%
        const every = Math.round(users.length/20);
        if (i % every == 0){
            console.log(`Adding accounts to users progress ${Math.round(100*(i / users.length))}%`)
        }
        const row = await knex("CurrencyAccounts").insert({ balance: 0 }).returning("id");
        await knex("Users").where({ id: users[i].id }).update({ accountID: row[0].id });
    }
    console.log("Finished adding accounts to users");

    await knex.schema.alterTable("Users", (t) => {
        t.dropNullable("accountID");
        t.unique("accountID");
    });

    await knex.schema.createTable("Organizations", (t) => {
        t.increments("id").primary();
        t.string("username").notNullable().unique();
        t.string("displayname").nullable();
        t.integer("accountID").references("id").inTable("CurrencyAccounts").notNullable();
    });

    await knex.schema.createTable("CurrencyLedger", (t) => {
        t.increments("id").primary();
        t.timestamp("dateTime").notNullable().defaultTo(knex.fn.now());
        t.integer("accountID").references("id").inTable("CurrencyAccounts").notNullable();
        t.integer("amount").notNullable();
        t.string("source").notNullable();
        t.string("description").notNullable().defaultTo("");
        t.bigInteger("atxID").nullable();
        t.check("?? >= 0", ["atxID"]);
        t.bigInteger("refID").nullable();
        t.check("?? >= 0", ["refID"]);
    });

    await knex.schema.createTable("RefIDCounter", (t) => {
        t.integer("refID").notNullable();
    })

    await knex("RefIDCounter").insert({ refID: 1 });
}


export async function down(knex: Knex): Promise<void> {
}

