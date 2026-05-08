import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  knex.schema.hasTable("Users").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("Users", function (t) {
        t.increments("id").primary();
        t.string("firstName", 100);
        t.string("lastName", 100);
        t.boolean("isStudent").defaultTo(true);
        t.enu("privilege", ["MAKER", "MENTOR", "STAFF"]).defaultTo("MAKER");
        t.date("registrationDate").defaultTo(knex.fn.now());
        t.text("expectedGraduation");
        t.text("college");
        t.text("major");
      });
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.hasTable("Users").then(function (exists) {
    if (exists) {
      return knex.schema.dropTable("Users");
    }
  });
}
