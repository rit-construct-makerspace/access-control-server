import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("RoomSwipes");
  if (exists) return;

  return knex.schema.createTable("RoomSwipes", (t) => {
    t.increments("id").primary();
    t.dateTime("dateTime").defaultTo(knex.fn.now());
    t.integer("roomID").references("id").inTable("Rooms");
    t.integer("userID").references("id").inTable("Users");
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("RoomSwipes");
  if (!exists) return;

  return knex.schema.dropTable("RoomSwipes");
}
