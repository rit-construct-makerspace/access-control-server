import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("AuditLogs").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("AuditLogs", function (t) {
            t.string("category").nullable();
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("AuditLogs").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("AuditLogs", function (t) {
            t.dropColumn("category");
        });
    });
}

