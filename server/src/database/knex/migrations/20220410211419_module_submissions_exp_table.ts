import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  knex.schema.hasTable("ModuleSubmissions").then(function (exists) {
    if (!exists) return;

    return knex.schema.alterTable("ModuleSubmissions", function (t) {
      t.timestamp("expirationDate").defaultTo(knex.raw(`? + ?::INTERVAL`, [knex.fn.now(), '365 day']));
    });
  });
}


export async function down(knex: Knex): Promise<void> {
  knex.schema.hasTable("ModuleSubmissions").then(function (exists) {
    if (!exists) return;

    return knex.schema.alterTable("ModuleSubmissions", function (t) {
      t.dropColumn("expirationDate");
    });
  });
}

