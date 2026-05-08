import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("InventoryItem").then(function (exists) {
        if (!exists) return;
        knex.schema.hasColumn("InventoryItem", "tagID1").then(function(c) {
            if (c) return;
            return knex.schema.alterTable("InventoryItem", function (t) {
                    t.integer("tagID1").references("id").inTable("InventoryTags");
                    t.integer("tagID2").references("id").inTable("InventoryTags");
                    t.integer("tagID3").references("id").inTable("InventoryTags");
                });
            });
        })
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("InventoryItem").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("InventoryItem", function (t) {
            t.dropColumn("tagID1");
            t.dropColumn("tagID2");
            t.dropColumn("tagID3");
        });
    });
}

