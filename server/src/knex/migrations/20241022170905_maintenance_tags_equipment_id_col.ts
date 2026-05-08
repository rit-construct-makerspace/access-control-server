import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("MaintenanceTags").then(function (exists) {
        if (!exists) return;
        knex.schema.hasColumn("MaintenanceTags", "equipmentID").then(function(c) {
            if (c) return;
            return knex.schema.alterTable("MaintenanceTags", function (t) {
                    t.integer("equipmentID").references("id").inTable("Equipment");
                });
            });
        })
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("v").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("MaintenanceTags", function (t) {
            t.dropColumn("equipmentID");
        });
    });
}

