import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("Users").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("Users", function (t) {
            t.boolean("archived").defaultTo(false);
        });
      });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("Users").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("Users", function (t) {
            t.dropColumn("archived");
        });
    });
}