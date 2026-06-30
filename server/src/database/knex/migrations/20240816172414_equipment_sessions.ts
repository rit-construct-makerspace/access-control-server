import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("EquipmentSessions");
  if (exists) return;

  return knex.schema.createTable("EquipmentSessions", (t) => {
    t.increments("id").primary();
    t.dateTime("start").defaultTo(knex.fn.now());
    t.integer("equipmentID").references("id").inTable("Rooms");
    t.integer("userID").references("id").inTable("Users");
    t.integer("sessionLength").nullable();
    t.string("readerSlug").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("EquipmentSessions");
  if (!exists) return;

  return knex.schema.dropTable("EquipmentSessions");
}
