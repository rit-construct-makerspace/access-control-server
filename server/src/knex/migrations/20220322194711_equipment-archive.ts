import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema
        .hasTable("Equipment")
        .then(function (exists) {
            if (exists) {
                return knex.schema.alterTable("Equipment", function (t) {
                    t.boolean("archived").defaultTo(false);
                });
            }
        })
        .then(async () => {
            knex.schema.hasTable("Reservations").then(function (exists) {
                if (exists) {
                    return knex.schema.alterTable("Reservations", function (t) {
                        t.boolean("archived").defaultTo(false);
                    });
                }
            });
        });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema
        .hasTable("Equipment")
        .then(function (exists) {
            if (exists) {
                return knex.schema.alterTable("Equipment", function (t) {
                    t.dropColumn("archived");
                });
            }
        })
        .then(async () => {
            knex.schema.hasTable("Reservations").then(function (exists) {
                if (exists) {
                    return knex.schema.alterTable("Reservations", function (t) {
                        t.dropColumn("archived");
                    });
                }
            });
        });
}

