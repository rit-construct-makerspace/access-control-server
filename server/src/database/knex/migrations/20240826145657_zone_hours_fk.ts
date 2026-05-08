import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("OpenHours").then(function (exists) {
        if (exists) return;
        return knex.schema.alterTable("OpenHours", function (t) {
            t.integer("zoneID").references("id").inTable("Zones");
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("OpenHours").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("OpenHours", function (t) {
            t.dropColumn("zoneID");
        });
    });
}

