import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("Users").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("Users", function (t) {
            t.string("refreshToken");
            t.dateTime("refreshTokenExpiration");
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("Users").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("Users", function (t) {
            t.dropColumn("refreshToken");
            t.dropColumn("refreshTokenExpiration");
        });
    });
}

