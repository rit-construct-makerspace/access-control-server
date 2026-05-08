import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("ResolutionLogs").then(function (exists) {
        if (!exists) return;
        knex.schema.hasColumn("ResolutionLogs", "instance").then(function(c) {
            if (c) return;
            return knex.schema.alterTable("ResolutionLogs", function (t) {
                    t.integer("instanceID").references("id").inTable("EquipmentInstances");
                });
            });
        })
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("v").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("ResolutionLogs", function (t) {
            t.dropColumn("instanceID");
        });
    });
}

