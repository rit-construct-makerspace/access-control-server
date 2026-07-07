import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("DataPoints");
  if (exists) return;

  return knex.schema.createTable("DataPoints", (t) => {
    t.increments("id").primary();
    t.string("label");
    t.bigint("value");
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("DataPoints");
  if (!exists) return;

  return knex.schema.dropTable("DataPoints");
}
