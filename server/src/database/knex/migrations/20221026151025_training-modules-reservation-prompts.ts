import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable("TrainingModule").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("TrainingModule", function (t) {
            t.json("reservationPrompt").defaultTo(JSON.stringify({ promptText: "Make reservation", enabled: false }));
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable("TrainingModule").then(function (exists) {
        if (!exists) return;

        return knex.schema.alterTable("TrainingModule", function (t) {
          t.dropColumn("reservationPrompt");
        });
    });
}