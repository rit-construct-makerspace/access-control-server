import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("Rooms").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("Rooms", function (t) {
            t.boolean("archived").defaultTo(false);
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("Rooms").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("Rooms", function (t) {
            t.dropColumn("archived");
        });
    });
}

