import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  knex.schema.hasTable("Equipment").then(function (exists) {
    if (!exists) return;

    return knex.schema.alterTable("Equipment", function (t) {
      t.integer("roomID").references("id").inTable("Rooms")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.hasTable("Users").then(function (exists) {
    if (exists) {
      return knex.schema.alterTable("Users", function (t) {
        t.dropColumn("roomID");
      });
    }
  });
}
