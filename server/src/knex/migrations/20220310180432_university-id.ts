import { Knex } from "knex";

// Add universityID column to the Users table

export async function up(knex: Knex): Promise<void> {
  knex.schema.hasTable("Users").then(function (exists) {
    if (!exists) return;

    return knex.schema.alterTable("Users", function (t) {
      t.string("universityID");
      t.string("cardTagID");
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.hasTable("Users").then(function (exists) {
    if (exists) {
      return knex.schema.alterTable("Users", function (t) {
        t.dropColumn("universityID");
        t.string("cardTagID");
      });
    }
  });
}
