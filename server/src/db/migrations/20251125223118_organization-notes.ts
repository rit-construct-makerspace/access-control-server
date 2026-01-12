import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizations", (table) => {
    table.text("notes").notNullable().defaultTo('').after("displayname").comment("Notes about the organization for staff");
  });
}


export async function down(knex: Knex): Promise<void> {
 await knex.schema.alterTable("Organizations", (table) => {
    table.dropColumn("notes");
  });
}

