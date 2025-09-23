import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("Rooms", (table) => {
    table.boolean("deleted").defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("Rooms", (table) => {
    table.dropColumn("deleted");
  });
}
