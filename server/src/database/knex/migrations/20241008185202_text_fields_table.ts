import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("TextFields");
  if (exists) return;

  return knex.schema.createTable("TextFields", (t) => {
    t.increments("id").primary();
    t.string("value");
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("TextFields");
  if (!exists) return;

  return knex.schema.dropTable("TextFields");
}
