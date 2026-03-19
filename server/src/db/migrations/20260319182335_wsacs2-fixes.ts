import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("DeviceLogs", (t) => {
    t.dropPrimary();
    t.dropColumn("id");
  });
  await knex.schema.alterTable("DeviceLogs", (t) => {
    t.increments("id").primary();
  });

  if (!(await knex.schema.hasColumn("AccessControllers", "tempDuration"))) {
    await knex.schema.alterTable("AccessControllers", (t) => {
      t.integer("tempDuration").notNullable().defaultTo(0);
    })
  }
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("DeviceLogs", (t) => {
    t.dropPrimary();
    t.dropColumn("id");
  });
  await knex.schema.alterTable("DeviceLogs", (t) => {
    t.integer("id").primary();
  });
}

