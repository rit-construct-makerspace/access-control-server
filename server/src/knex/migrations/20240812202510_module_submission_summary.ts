import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("ModuleSubmissions").then(function (exists) {
        if (!exists) return;
        return knex.schema.hasColumn("ModuleSubmissions", "summary").then(function (exists) {
            if (exists) return;
            return knex.schema.alterTable("ModuleSubmissions", function (t) {
                t.json("summary").nullable();
            });
        })
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("ModuleSubmissions").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("ModuleSubmissions", function (t) {
            t.dropColumn("summary");
        });
    });
}

