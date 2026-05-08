import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("AuditLogs", function (t) {
    t.dropColumn("eventType");
    t.dropColumn("userID");
    t.renameColumn("timeDate", "dateTime");
    t.renameColumn("description", "message");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("AuditLogs", function (t) {
    t.integer("userID").references("id").inTable("Users");
    t.enu("eventType", [
      "DATABASE_MODIFICATION",
      "PURCHASE_ORDERS",
      "RESERVATIONS",
      "TRAINING",
      "INVENTORY_MANAGEMENT",
      "TRAINING_MANAGEMENT",
      "EQUIPMENT_MANAGEMENT",
      "USER_MANAGEMENT",
      "ROOM_MANAGEMENT",
    ]);
    t.renameColumn("dateTime", "timeDate");
    t.renameColumn("message", "description");
  });
}
