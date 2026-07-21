import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("EquipmentInstances").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("EquipmentInstances", function (t) {
            t.integer("hobbsTime").defaultTo(0);
        });
    });

}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("EquipmentInstances").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("EquipmentInstances", function (t) {
            t.dropColumn("hobbsTime");
        });
    });

}

