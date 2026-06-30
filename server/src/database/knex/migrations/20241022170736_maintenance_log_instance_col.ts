import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("MaintenanceLogs").then(function (exists) {
        if (!exists) return;
        knex.schema.hasColumn("MaintenanceLogs", "instance").then(function(c) {
            if (c) return;
            return knex.schema.alterTable("MaintenanceLogs", function (t) {
                    t.integer("instanceID").references("id").inTable("EquipmentInstances");
                });
            });
        })
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("v").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("MaintenanceLogs", function (t) {
            t.dropColumn("instanceID");
        });
    });
}

