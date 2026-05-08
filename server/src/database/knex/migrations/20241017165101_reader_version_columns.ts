import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("Readers").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("Readers", function (t) {
            t.string("BEVer").nullable();
            t.string("FEVer").nullable();
            t.string("HWVer").nullable();
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("Readers").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("Readers", function (t) {
            t.dropColumn("BEVer");
            t.dropColumn("FEVer");
            t.dropColumn("HWVer");
        });
    });
}

