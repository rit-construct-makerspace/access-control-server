import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .hasTable("ModuleSubmissions")
    .then(function (exists) {
      if (!exists) {
        return knex.schema.createTable("ModuleSubmissions", function (t) {
          t.increments("id").primary();
          t.integer("moduleID").references("id").inTable("TrainingModule")
            .onUpdate('CASCADE')
            .onDelete('CASCADE');
          t.integer('makerID').references('id').inTable('Users')
            .onUpdate('CASCADE')
            .onDelete('CASCADE');
          t.timestamp("submissionDate").defaultTo(knex.fn.now());
          t.boolean("passed");
        });
      }
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .hasTable("ModuleSubmissions")
    .then(function (exists) {
      if (exists) {
        return knex.schema.dropTable("ModuleSubmissions");
      }
    });
}
