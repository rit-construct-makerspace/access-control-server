import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("OpenHours").then(function (exists) {
        if (exists) return;
        return knex.schema.alterTable("OpenHours", function (t) {
            t.dropColumn("zoneName");
            t.dropColumn("zone");
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("OpenHours").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("OpenHours", function (t) {
            t.string("zoneName");
            t.string("zone");
        });
    });
}

