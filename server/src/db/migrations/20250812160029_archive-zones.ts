import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  const colExists = await knex.schema.hasColumn("Zones", "archived");

  if (colExists) {
    return;
  }

  await knex.schema.alterTable("Zones", (t) => {
    t.boolean("archived").notNullable().defaultTo(false);
  })
}


export async function down(knex: Knex): Promise<void> {
  const colExists = await knex.schema.hasColumn("Zones", "archived");

  if (!colExists) {
    return;
  }

  knex.schema.alterTable("zones", (t) => {
    t.dropColumn("archived");
  })
}

