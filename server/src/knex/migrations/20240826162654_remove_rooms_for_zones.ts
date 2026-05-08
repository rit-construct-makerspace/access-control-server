import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("RoomsForZones").then(function (exists) {
        if (!exists) return;
        return knex.schema.dropTable("RoomsForZones");
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("RoomsForZones").then(function (exists) {
        if (exists) return;
        return knex.schema.createTable("RoomsForZones", function (t) {
            t.integer("zoneID").references("id").inTable("Zones");
            t.integer("roomID").references("id").inTable("Rooms");
        });
    });
}

