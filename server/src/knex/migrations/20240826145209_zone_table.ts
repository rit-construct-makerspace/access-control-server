import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("Zones").then(function (exists) {
        if (exists) return;
        return knex.schema.createTable("Zones", function (t) {
            t.increments("id").primary();
            t.string("name").notNullable();
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("Zones").then(function (exists) {
        if (!exists) return;

        return knex.schema.dropTable("Zones");
    });
}

