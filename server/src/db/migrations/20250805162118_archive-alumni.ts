import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  const colsExist = await knex.schema.hasColumn("Users", "forceArchive");
  if (colsExist) {
    return;
  }

  await knex.schema.alterTable("Users", (t) => {
    t.boolean("forceArchive").nullable().defaultTo(null);
  })
}


export async function down(knex: Knex): Promise<void> {
  const colsExist = await knex.schema.hasColumn("Users", "forceArchive");
  if (!colsExist) {
    return
  }

  await knex.schema.alterTable("Users", (t) => {
    t.dropColumn("forceArchive");
  })
}

