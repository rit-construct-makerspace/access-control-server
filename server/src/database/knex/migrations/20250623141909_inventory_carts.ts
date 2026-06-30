import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const cartsExists = await knex.schema.hasTable("InventoryCarts");
  if (!cartsExists) {
    return knex.schema.createTable("InventoryCarts", (t) => {
      t.increments("id").primary();
      t.integer("userID").references("id").inTable("Users");
      t.integer("makerspaceID").references("id").inTable("Zones");
      t.unique(["userID", "makerspaceID"]);
      t.timestamp("lastModified").nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("InventoryCarts");
  if (!exists) return;

  return knex.schema.dropTable("InventoryCarts");
}
