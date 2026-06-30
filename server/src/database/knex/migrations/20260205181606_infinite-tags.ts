import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("InventoryItemTagRelations")) { return; }

  await knex.schema.createTable("InventoryItemTagRelations", (t) => {
    t.integer("itemID").references("id").inTable("InventoryItem").notNullable();
    t.integer("tagID").references("id").inTable("InventoryTags").notNullable();
    t.primary(["itemID", "tagID"]);
  });

  const items = await knex("InventoryItem").select("*");

  for (let i = 0; i < items.length; i++) {
    // @ts-expect-error removed in this migration
    if (items[i].tagID1 !== null) {
      // @ts-expect-error removed in this migration
      await knex("InventoryItemTagRelations").insert({ itemID: items[i].id, tagID: items[i].tagID1 ?? undefined })
    }
    // @ts-expect-error removed in this migration
    if (items[i].tagID2 !== null) {
      // @ts-expect-error removed in this migration
      await knex("InventoryItemTagRelations").insert({ itemID: items[i].id, tagID: items[i].tagID2 ?? undefined })
    }
    // @ts-expect-error removed in this migration
    if (items[i].tagID3 !== null) {
      // @ts-expect-error removed in this migration
      await knex("InventoryItemTagRelations").insert({ itemID: items[i].id, tagID: items[i].tagID3 ?? undefined })
    }
  }

  await knex.schema.alterTable("InventoryItem", (t) => {
    t.dropColumn("tagID1");
    t.dropColumn("tagID2");
    t.dropColumn("tagID3");
  });

}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("InventoryItemTagRelations");

  await knex.schema.alterTable("InventoryItem", (t) => {
    t.integer("tagID1").references("id").inTable("InventoryTags").nullable();
    t.integer("tagID2").references("id").inTable("InventoryTags").nullable();
    t.integer("tagID3").references("id").inTable("InventoryTags").nullable();
  });
}

