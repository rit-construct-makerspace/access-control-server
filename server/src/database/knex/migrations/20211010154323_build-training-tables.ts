import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  knex.schema.hasTable("TrainingModule").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("TrainingModule", function (t) {
        t.increments("id").primary();
        t.string("name");
        t.json("quiz").defaultTo(JSON.stringify([]));
      });
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.hasTable("TrainingModule").then(function (exists) {
    if (exists) {
      return knex.schema.dropTable("TrainingModule");
    }
  });
}
