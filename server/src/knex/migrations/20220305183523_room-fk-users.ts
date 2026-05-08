import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  knex.schema.hasTable("Users").then(function (exists) {
    if (!exists) return;

    return knex.schema.alterTable("Users", function (t) {
      t.integer("roomID").references("id").inTable("Rooms");
      t.integer("monitoringRoomID").references("id").inTable("Rooms");
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.hasTable("Users").then(function (exists) {
    if (exists) {
      return knex.schema.alterTable("Users", function (t) {
        t.dropColumn("roomID");
        t.dropColumn("monitoringRoomID");
      });
    }
  });
}
