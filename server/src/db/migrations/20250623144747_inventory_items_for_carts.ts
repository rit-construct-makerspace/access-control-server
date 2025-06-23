import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const itemsForCartsExists = await knex.schema.hasTable("InventoryItemsForCarts");
  if (!itemsForCartsExists) {
    return knex.schema.createTable("InventoryItemsForCarts", (t) => {
      t.integer("cartID").references("id").inTable("InventoryCarts").notNullable();
      t.integer("itemID").references("id").inTable("Zones").notNullable();
      t.integer("count").notNullable();
      t.primary(["cartID", "itemID"]);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("InventoryItemsForCarts");
  if (!exists) return;

  return knex.schema.dropTable("InventoryItemsForCarts");
}
