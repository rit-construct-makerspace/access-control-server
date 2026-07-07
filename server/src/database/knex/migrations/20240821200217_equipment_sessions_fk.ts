import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("EquipmentSessions").then(function (exists) {
        if (!exists) return;
        return knex.schema.hasColumn("EquipmentSessions", "equipmentID").then(async function (exists) {
            if (!exists) return;
            return knex.schema.alterTable("EquipmentSessions", function (t) {
                t.dropColumn("equipmentID");
            });
        }).then(function(t) {
            return knex.schema.alterTable("EquipmentSessions", function (t) {
                t.integer("equipmentID").references("id").inTable("Equipment");
            });
        })
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("EquipmentSessions").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("EquipmentSessions", function (t) {
            t.dropColumn("equipmentID");
        });
    });
}

