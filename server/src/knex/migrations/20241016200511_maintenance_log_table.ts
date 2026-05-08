import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("MaintenanceLogs");
  if (exists) return;

  return knex.schema.createTable("MaintenanceLogs", (t) => {
    t.increments("id").primary();
    t.integer("authorID").references("id").inTable("Users");
    t.integer("equipmentID").references("id").inTable("Equipment");
    t.timestamp("timestamp").defaultTo(knex.raw('now()'));
    t.text("content");
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("MaintenanceLogs");
  if (!exists) return;

  return knex.schema.dropTable("MaintenanceLogs");
}
