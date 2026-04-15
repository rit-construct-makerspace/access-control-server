import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("Themes")) {
    return;
  }

  await knex.schema.createTable("Themes", (t) => {
    t.increments("id").primary();
    t.string("themeName").notNullable().defaultTo("");
    t.string("title").notNullable().defaultTo("Make");
    t.jsonb("muiThemeOptions").defaultTo({});
    t.string("logo").notNullable().defaultTo("");
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("Themes");
}

