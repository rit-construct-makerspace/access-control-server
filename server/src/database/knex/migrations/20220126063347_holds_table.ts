import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.hasTable("Holds").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("Holds", function (t) {
        t.increments("id");
        t.integer("creatorID").references("id").inTable("Users")
          .onUpdate('CASCADE')
          .onDelete("SET NULL");
        t.integer("removerID").references("id").inTable("Users")
          .onUpdate('CASCADE')
          .onDelete("SET NULL");
        t.integer("userID").references("id").inTable("Users")
          .onUpdate("CASCADE")
          .onDelete("CASCADE");
        t.text("description");
        t.timestamp("createDate").defaultTo(knex.fn.now());
        t.timestamp("removeDate");
      });
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.hasTable("Holds").then(function (exists) {
    if (exists) {
      return knex.schema.dropTable("Holds");
    }
  });
}
