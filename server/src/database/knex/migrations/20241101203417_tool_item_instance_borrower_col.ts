import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("ToolItemInstances").then(function (exists) {
        if (!exists) return;
        knex.schema.hasColumn("ToolItemInstances", "borrowerUserID").then(function(c) {
            if (c) return;
            return knex.schema.alterTable("ToolItemInstances", function (t) {
                    t.integer("borrowerUserID").references("id").inTable("Users");
                    t.timestamp("borrowedAt");
                });
            });
        })
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("v").then(function (exists) {
        if (!exists) return;
        return knex.schema.alterTable("ToolItemInstances", function (t) {
            t.dropColumn("borrowerUserID");
        });
    });
}

