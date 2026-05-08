import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .hasTable("Equipment")
    .then(function (exists) {
      if (!exists) {
        return knex.schema.createTable("Equipment", function (t) {
          t.increments("id").primary();
          t.string("name", 50);
          t.timestamp("addedAt").defaultTo(knex.fn.now());
          t.boolean("inUse").defaultTo(false);
        });
      }
    })
    .then(async () => {
      const exists = await knex.schema.hasTable("ModulesForEquipment");
      if (!exists) {
        return knex.schema.createTable("ModulesForEquipment", function (t) {
          t.increments("id").primary();
          t.integer("equipmentID").references("id").inTable("Equipment")
            .onUpdate('CASCADE')
            .onDelete('CASCADE');
          t.integer("moduleID").references("id").inTable("TrainingModule")
            .onUpdate('CASCADE')
            .onDelete('CASCADE');
        });
      }
    })
    .then(async () => {
      const exists = await knex.schema.hasTable("Reservations");
      if (!exists) {
        return knex.schema.createTable("Reservations", function (t) {
          t.increments("id").primary();
          t.integer("makerID").references("id").inTable("Users");
          t.timestamp("createDate").defaultTo(knex.fn.now());
          t.time("startTime");
          t.time("endTime");
          t.integer("equipmentID").references("id").inTable("Equipment");
          t.enu('status', ['PENDING', 'CONFIRMED', 'CANCELLED']).defaultTo("PENDING");
          t.timestamp('lastUpdated').defaultTo(knex.fn.now());
        });
      }
    })
    .then(async () => {
      const exists = await knex.schema.hasTable("ReservationEvents");
      if (!exists) {
        return knex.schema.createTable("ReservationEvents", function (t) {
          t.increments("id").primary();
          t.enu("eventType", [
            "COMMENT",
            "ASSIGNMENT",
            "CONFIRMATION",
            "CANCELLATION",
          ]);
          t.integer("reservationID").references("id").inTable("Reservations");
          t.integer("userID").references("id").inTable("Users");
          t.timestamp("dateTime").defaultTo(knex.fn.now());
          t.string("payload", 500);
        });
      }
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .hasTable("Equipment")
    .then(function (exists) {
      if (exists) {
        return knex.schema.dropTable("Equipment");
      }
    })
    .then(async () => {
      const exists = await knex.schema.hasTable("ModulesForEquipment");
      if (exists) {
        return knex.schema.dropTable("ModulesForEquipment");
      }
    })
    .then(async () => {
      knex.schema.hasTable("Reservations").then(function (exists) {
        if (exists) {
          return knex.schema.dropTable("Reservations");
        }
      });
    })
    .then(async () => {
      const exists = await knex.schema.hasTable("ReservationEvents");
      if (exists) {
        return knex.schema.dropTable("ReservationEvents");
      }
    });
}
