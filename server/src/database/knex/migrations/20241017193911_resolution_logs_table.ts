import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("ResolutionLogs");
  if (exists) return;

  return knex.schema.createTable("ResolutionLogs", (t) => {
    t.increments("id").primary();
    t.integer("authorID").references("id").inTable("Users");
    t.integer("equipmentID").references("id").inTable("Equipment");
    t.timestamp("timestamp").defaultTo(knex.raw('now()'));
    t.text("content");
    t.integer("tagID1").references("id").inTable("MaintenanceTags");
    t.integer("tagID2").references("id").inTable("MaintenanceTags");
    t.integer("tagID3").references("id").inTable("MaintenanceTags");
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("ResolutionLogs");
  if (!exists) return;

  return knex.schema.dropTable("ResolutionLogs");
}
