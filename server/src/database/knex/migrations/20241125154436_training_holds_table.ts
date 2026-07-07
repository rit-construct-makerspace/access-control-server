import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("TrainingHolds");
  if (exists) return;

  return knex.schema.createTable("TrainingHolds", (t) => {
    t.increments("id").primary();
    t.integer("moduleID").references("id").inTable("TrainingModule").notNullable();
    t.integer("userID").references("id").inTable("Users").notNullable();
    t.timestamp("expires").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("TrainingHolds");
  if (!exists) return;

  return knex.schema.dropTable("TrainingHolds");
}
