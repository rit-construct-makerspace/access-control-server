import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("InventoryLedger");
  if (exists) return;

  return knex.schema.createTable("InventoryLedger", (t) => {
    t.increments("id").primary();
    t.timestamp("timestamp");
    t.integer("initiator").references("id").inTable("Users");
    t.string("category");
    t.double("totalCost");
    t.integer("purchaser").references("id").inTable("Users").nullable();
    t.text("notes");
    t.json("items");
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("InventoryLedger");
  if (!exists) return;

  return knex.schema.dropTable("InventoryLedger");
}
