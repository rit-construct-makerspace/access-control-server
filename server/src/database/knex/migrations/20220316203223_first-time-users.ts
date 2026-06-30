import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  knex.schema.hasTable("Users").then(function (exists) {
    if (!exists) return;

    return knex.schema.alterTable("Users", function (t) {
      t.boolean("setupComplete").defaultTo(false);
      t.string("ritUsername");
      t.string("pronouns");
      t.dropColumn("major");
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.hasTable("Users").then(function (exists) {
    if (!exists) return;

    return knex.schema.alterTable("Users", function (t) {
      t.dropColumn("setupComplete");
      t.dropColumn("ritUsername");
      t.dropColumn("pronouns");
      t.string("major");
    });
  });
}
