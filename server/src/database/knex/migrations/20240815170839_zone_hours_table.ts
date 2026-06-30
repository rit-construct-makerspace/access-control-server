import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("OpenHours").then(function (exists) {
        if (exists) return;
        return knex.schema.createTable("OpenHours", function (t) {
            t.increments("id").primary();
            t.string("zone").notNullable();
            t.string("type").notNullable();
            t.integer("dayOfTheWeek").notNullable();
            t.time("time").notNullable();
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("OpenHours").then(function (exists) {
        if (!exists) return;

        return knex.schema.dropTable("OpenHours");
    });
}

