import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("ResolutionLogs");
  await knex.schema.dropTableIfExists("MaintenanceLogs");
  await knex.schema.dropTableIfExists("MaintenanceTags");

  await knex.schema.createTable("MaintenanceTickets", (t) => {
    t.increments("id").primary();
    t.enu("severity", ["HIGH", "MEDIUM", "LOW"]).notNullable();
    t.enu("type", ["AUTOMATIC", "REPORTED"]).notNullable();
    t.integer("instanceID").references("id").inTable("EquipmentInstances").notNullable()
      .onUpdate("CASCADE").onDelete("CASCADE");
    t.integer("userID").references("id").inTable("Users").notNullable()
      .onUpdate("CASCADE").onDelete("CASCADE");
    t.string("description").notNullable().defaultTo("");
    t.string("imageUrl").nullable().defaultTo(null);
    t.boolean("closed").notNullable().defaultTo(false);
    t.timestamp("dateCreated").notNullable().defaultTo(knex.fn.now());
    t.timestamp("dateClosed").nullable();
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("MaintenanceTickets");
}

