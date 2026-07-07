import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("TrainingModule").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("TrainingModule", function (t) {
            t.boolean("archived").defaultTo(false);
        });
    });

    knex.schema.hasTable("ModuleItem").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("ModuleItem", function (t) {
            t.boolean("archived").defaultTo(false);
        });
    });

    knex.schema.hasTable("ModuleItemOption").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("ModuleItemOption", function (t) {
            t.boolean("archived").defaultTo(false);
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("TrainingModule").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("TrainingModule", function (t) {
            t.dropColumn("archived");
        });
    });

    knex.schema.hasTable("ModuleItem").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("ModuleItem", function (t) {
            t.dropColumn("archived");
        });
    });

    knex.schema.hasTable("ModuleItemOption").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("ModuleItemOption", function (t) {
            t.dropColumn("archived");
        });
    });
}

