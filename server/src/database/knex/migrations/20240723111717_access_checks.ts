import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .hasTable("AccessChecks")
    .then(function (exists) {
      if (!exists) {
        return knex.schema.createTable("AccessChecks", function (t) {
            t.increments("id").primary();
            t.integer("userID").references("id").inTable("Users").notNullable();
            t.integer("equipmentID").references("id").inTable("Equipment").notNullable();
            t.date("readyDate").defaultTo(knex.fn.now());
            t.boolean("approved").defaultTo(false);
        });
      }
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .hasTable("AccessChecks")
    .then(function (exists) {
      if (exists) {
        return knex.schema.dropTable("AccessChecks");
      }
    });
}
