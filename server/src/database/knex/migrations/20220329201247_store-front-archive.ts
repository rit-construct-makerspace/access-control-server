import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("InventoryItem").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("InventoryItem", function (t) {
            t.boolean("archived").defaultTo(false);
        });
    });

    knex.schema.hasTable("Label").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("Label", function (t) {
            t.boolean("archived").defaultTo(false);
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("InventoryItem").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("InventoryItem", function (t) {
            t.dropColumn("archived");
        });
    });

    knex.schema.hasTable("Label").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("Label", function (t) {
            t.dropColumn("archived");
        });
    });
}

