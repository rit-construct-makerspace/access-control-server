import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn("ModuleSubmissions", "moduleID")) {
    await knex.schema.alterTable("ModuleSubmissions", (t) => {
      t.dropForeign("moduleID");
      t.foreign("moduleID").references("id").inTable("TrainingModule").onDelete("CASCADE");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn("ModuleSubmissions", "moduleID")) {
    await knex.schema.alterTable("ModuleSubmissions", (t) => {
      t.dropForeign("moduleID");
      t.foreign("moduleID").references("id").inTable("TrainingModule");
    });
  }
}
