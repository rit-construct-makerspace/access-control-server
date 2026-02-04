import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("TemporaryCards")) {
    return;
  }

  await knex.schema.createTable("TemporaryCards", (t) => {
    t.increments("id").primary();
    t.integer("userID").references("id").inTable("Users").notNullable();
    t.string("cardTagID").notNullable();
    t.timestamp("issuedDate").notNullable().defaultTo(knex.fn.now());
    t.timestamp("returnedDate").nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("TemporaryCards");
}

