import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("ToolItemTypes");
  if (exists) return;

  return knex.schema.createTable("ToolItemTypes", (t) => {
    t.increments("id").primary();
    t.string("name").notNullable();
    t.integer("defaultLocationRoomID").references("id").inTable("Rooms").nullable();
    t.string("defaultLocationDescription");
    t.text("description");
    t.text("checkoutNote");
    t.text("checkinNote");
    t.boolean("allowCheckout").notNullable().defaultTo("false")
    t.string("imageUrl");
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("ToolItemTypes");
  if (!exists) return;

  return knex.schema.dropTable("ToolItemTypes");
}
