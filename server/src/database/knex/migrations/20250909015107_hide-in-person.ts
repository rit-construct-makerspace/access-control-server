import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  const hasCol = await knex.schema.hasColumn("Equipment", "requiresInPerson");

  if (hasCol) {
    return;
  }

  return await knex.schema.alterTable("Equipment", (t) => {
    t.boolean("requiresInPerson").notNullable().defaultTo(true);
  })
}


export async function down(knex: Knex): Promise<void> {
  const hasCol = await knex.schema.hasColumn("Equipment", "requiresInPerson");
  if (!hasCol) {
    return;
  }

  return await knex.schema.alterTable("Equipment", (t) => {
    t.dropColumn("requiresInPerson");
  })
}

