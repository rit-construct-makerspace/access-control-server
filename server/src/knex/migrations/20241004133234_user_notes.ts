import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("Users").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("Users", function (t) {
            t.text("notes");
            t.boolean("activeHold").defaultTo(false);
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("Users").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("Users", function (t) {
            t.dropColumn("notes");
            t.dropColumn("activeHold")
        });
    });
}

