import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("InventoryTags");
  if (exists) return;

  return knex.schema.createTable("InventoryTags", (t) => {
    t.increments("id").primary();
    t.string("label");
    t.string("color");
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("InventoryTags");
  if (!exists) return;

  return knex.schema.dropTable("InventoryTags");
}
