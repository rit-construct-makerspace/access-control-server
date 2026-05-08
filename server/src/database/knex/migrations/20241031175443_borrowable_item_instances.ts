import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("ToolItemInstances");
  if (exists) return;

  return knex.schema.createTable("ToolItemInstances", (t) => {
    t.increments("id").primary();
    t.integer("typeID").references("id").inTable("ToolItemTypes").notNullable();
    t.string("uniqueIdentifier").notNullable();
    t.integer("locationRoomID").references("id").inTable("Rooms").nullable();
    t.string("locationDescription");
    t.string("condition").notNullable();
    t.string("status").notNullable();
    t.text("notes");
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("ToolItemInstances");
  if (!exists) return;

  return knex.schema.dropTable("ToolItemInstances");
}
