import { Knex } from "knex";

/*
Remove roomID and monitoringRoomID from the Users table since we
no longer have the requirement of mentors clicking a button to
start monitoring a room. For roomID, we are now using the
RoomSwipes table instead.
 */

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("Users");
  if (!exists) return;

  return knex.schema.alterTable("Users", (t) => {
    t.dropColumn("roomID");
    t.dropColumn("monitoringRoomID");
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("Users");
  if (!exists) return;

  return knex.schema.alterTable("Users", (t) => {
    t.integer("roomID").references("id").inTable("Rooms");
    t.integer("monitoringRoomID").references("id").inTable("Rooms");
  });
}
