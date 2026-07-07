import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  knex.schema.hasTable("Readers").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("Readers", function (t) {
        t.increments("id").primary();
        t.integer("machineID").references("id").inTable("Equipment").nullable();
        t.string("machineType");
        t.string("name");
        t.string("zone");
        t.double("temp");
        t.string("state");
        t.string("currentUID");
        t.integer("recentSessionLength");
        t.string("lastStatusReason");
        t.integer("scheduledStatusFreq");
        t.timestamp("lastStatusTime");
        t.boolean("helpRequested").defaultTo(false);
      });
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.hasTable("Readers").then(function (exists) {
    if (exists) {
      return knex.schema.dropTable("Readers");
    }
  });
}
