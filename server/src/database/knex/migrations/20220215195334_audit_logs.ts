import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.hasTable('AuditLogs').then(function(exists) {
        if (!exists) {
            return knex.schema.createTable('AuditLogs', function(t) {
                t.increments('id').primary();
                t.dateTime('timeDate').defaultTo(knex.fn.now());
                t.integer('userID').references("id").inTable("Users");
                t.enu('eventType', ['DATABASE_MODIFICATION', 'PURCHASE_ORDERS', 'RESERVATIONS', 'TRAINING', 'INVENTORY_MANAGEMENT', 'TRAINING_MANAGEMENT', 'EQUIPMENT_MANAGEMENT', 'USER_MANAGEMENT', 'ROOM_MANAGEMENT']);
                t.text('description');
            });
        }
    });
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.hasTable('AuditLogs').then(function(exists) {
        if (exists) {
            return knex.schema.dropTable('AuditLogs');
        }
    });
}

