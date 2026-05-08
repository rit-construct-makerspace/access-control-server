import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("EquipmentInstances");
  if (exists) return;

  return knex.schema.createTable("EquipmentInstances", (t) => {
    t.increments("id").primary();
    t.integer("equipmentID").references("id").inTable("Equipment").notNullable();;
    t.string("name");
    t.string("status").defaultTo("UNDEPLOYED");
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("EquipmentInstances");
  if (!exists) return;

  return knex.schema.dropTable("EquipmentInstances");
}
