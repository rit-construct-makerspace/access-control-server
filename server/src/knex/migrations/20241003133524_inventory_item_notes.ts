import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("InventoryItem").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("InventoryItem", function (t) {
            t.text("notes");
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("InventoryItem").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("InventoryItem", function (t) {
            t.dropColumn("notes");
        });
    });
}

