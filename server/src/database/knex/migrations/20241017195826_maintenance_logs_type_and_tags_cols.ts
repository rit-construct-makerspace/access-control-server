import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("MaintenanceLogs").then(function (exists) {
        if (!exists) return;
        knex.schema.hasColumn("MaintenanceLogs", "tagID1").then(function(c) {
            if (c) return;
            return knex.schema.alterTable("MaintenanceLogs", function (t) {
                    t.integer("tagID1").references("id").inTable("MaintenanceTags");
                    t.integer("tagID2").references("id").inTable("MaintenanceTags");
                    t.integer("tagID3").references("id").inTable("MaintenanceTags");
                });
            });
        })
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("v").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("MaintenanceLogs", function (t) {
            t.dropColumn("tagID1");
            t.dropColumn("tagID2");
            t.dropColumn("tagID3");
        });
    });
}

