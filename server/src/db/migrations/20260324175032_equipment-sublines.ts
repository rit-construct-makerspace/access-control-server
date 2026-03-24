import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

  if (await knex.schema.hasColumn("Equipment", "subName")) {
    return;
  }

  await knex.schema.alterTable("Equipment", (t) => {
    t.string("signOffUrl").notNullable().defaultTo("");
    t.string("subName").notNullable().defaultTo("");
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Equipment", (t) => {
    t.dropColumns("signOffUrl", "subName");
  })
}

