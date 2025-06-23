import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const makerspaceColExists = await knex.schema.hasColumn("InventoryItems", "makerspaceID");
  if (!makerspaceColExists) {
    return knex.schema.alterTable("InventoryItems", (t) => {
      t.integer("makerspaceID").references("id").inTable("InventoryCarts").nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const makerspaceColExists = await knex.schema.hasColumn("InventoryItems", "makerspaceID");
  if (!makerspaceColExists) return;
  return knex.schema.alterTable("InventoryItems", (t) => {
    t.dropColumn("makerspaceID");
  });
}
