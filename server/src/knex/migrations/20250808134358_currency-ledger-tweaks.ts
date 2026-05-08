import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  const colExists = await knex.schema.hasColumn("CurrencyLedger", "owner");

  if (colExists) {
    return;
  }

  await knex.schema.alterTable("CurrencyLedger", (t) => {
    t.setNullable("accountID");
    t.dropForeign("accountID");
    t.foreign("accountID").references("id").inTable("CurrencyAccounts")
      .onUpdate("CASCADE")
      .onDelete("SET NULL");
    t.string("owner").notNullable().defaultTo("");
  })
}


export async function down(knex: Knex): Promise<void> {
  const colExists = await knex.schema.hasColumn("CurrencyLedger", "owner");

  if (!colExists) {
    return;
  }

  await knex.schema.alterTable("CurrencyLedger", (t) => {
    t.dropNullable("accountID");
    t.dropForeign("accountID");
    t.foreign("accountID").references("id").inTable("CurrencyAccounts");
    t.dropColumn("owner");
  })
}

