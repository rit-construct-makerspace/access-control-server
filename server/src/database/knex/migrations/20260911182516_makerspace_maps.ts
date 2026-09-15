import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasColumn("Makerspaces", "mapSvgUrl").then(function (exists) {
        if (exists) return;

        return knex.schema.alterTable("Makerspaces", function (t) {
            t.string("mapSvgUrl").nullable();
        });
    });


}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasColumn("Makerspaces", "mapSvgUrl").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("Makerspaces", function (t) {
            t.dropColumn("mapSvgUrl");
        });
    });

}

