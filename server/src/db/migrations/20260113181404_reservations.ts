import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn("Reservations", "userID")) {
    return;
  }

  if (await knex.schema.hasColumn("Reservations", "makerID")) {
    await knex.schema.dropTableIfExists("ReservationEvents");
    await knex.schema.dropTable("Reservations");
  }

  await knex.schema.createTable("Reservations", (t) => {
    t.increments("id").primary();
    t.integer("equipmentID").references("id").inTable("Equipment").notNullable()
      .onUpdate("CASCADE").onDelete("CASCADE");
    t.integer("userID").references("id").inTable("Users").notNullable()
      .onUpdate("CASCADE").onDelete("CASCADE");
    t.string("description").notNullable();
    t.boolean("approved").notNullable().defaultTo(false);
    t.timestamp("start").notNullable();
    t.timestamp("end").notNullable();
  });

  await knex.schema.alterTable("Equipment", (t) => {
    t.boolean("schedulable").notNullable().defaultTo(false);
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("Reservations");
  await knex.schema.alterTable("Equipment", (t) => {
    t.dropColumn("schedulable");
  })
}

