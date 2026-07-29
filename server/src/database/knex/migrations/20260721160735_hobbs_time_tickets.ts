import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("MaintenanceTickets").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("MaintenanceTickets", function (t) {
            t.enum("timeUnit", ["USAGE", "CALENDAR"]).notNullable().defaultTo("CALENDAR")
            t.integer("hobbsTimeAtCreate").notNullable().defaultTo(0);
            t.integer("hobbsTimeAtClose").nullable();
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("MaintenanceTickets").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("MaintenanceTickets", function (t) {
            t.dropColumns("timeUnit", "hobbsTimeAtCreate", "hobbsTimeAtClose");
        });
    });

}

