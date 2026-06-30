import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable("ExpressSessions");
  if (tableExists) {
    return;
  }

  await knex.schema.createTable("ExpressSessions", (t) => {
    t.string("sid").primary();
    t.string("session").notNullable();
  })
}


export async function down(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable("ExpressSessions");
  if (!tableExists) {
    return;
  }

  await knex.schema.dropTable("ExpressSessions");
}

