import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("InventoryItem", function (table) {
    table.integer("threshold").defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("InventoryItem", function (table) {
    table.dropColumn("threshold");
  });
}
