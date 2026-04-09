import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn("EquipmentInstances", "readerID"))) {
    return;
  }

  await knex.schema.alterTable("EquipmentInstances", (t) => {
    t.dropColumn("readerID");
    t.dropForeign("accessControllerID");
    t.foreign("accessControllerID").references("id").inTable("AccessControllers").onUpdate("CASCADE").onDelete("SET NULL");
  })
}


export async function down(knex: Knex): Promise<void> {
}

