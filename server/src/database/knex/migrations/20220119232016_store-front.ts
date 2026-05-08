import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

    knex.schema.hasTable('InventoryItem').then((exists) => {
        if (!exists) {
            return knex.schema.createTable('InventoryItem', (t) => {
                t.increments('id').primary();
                t.text('image');
                t.text('name');
                t.text('unit');
                t.text('pluralUnit');
                t.integer('count');
                t.float('pricePerUnit');
            });
        }
    });

    // if we know every label we can use an enum instead of this table
    knex.schema.hasTable('Label').then((exists) => {
        if (!exists) {
            return knex.schema.createTable('Label', (t) => {
                t.increments('id').primary();
                t.text('label');
            });
        }
    });

    knex.schema.hasTable('InventoryItemLabel').then((exists) => {
        if (!exists) {
            return knex.schema.createTable('InventoryItemLabel', (t) => {
                t.increments('id').primary();
                t.integer('item')
                    .references('InventoryItem.id')
                    .onUpdate('CASCADE')
                    .onDelete('CASCADE');
                t.integer('label')
                    .references('Label.id')
                    .onUpdate('CASCADE')
                    .onDelete('CASCADE');
            });
        }
    });

    knex.schema.hasTable('PurchaseOrder').then((exists) => {
        if (!exists) {
            return knex.schema.createTable('PurchaseOrder', (t) => {
                t.increments('id').primary();
                t.text('creator'); // TODO: update this when we have user stuff done
                t.date('createDate');
                t.date('expectedDeliveryDate');
            });
        }
    });

    knex.schema.hasTable('PurchaseOrderItem').then((exists) => {
        if (!exists) {
            return knex.schema.createTable('PurchaseOrderItem', (t) => {
                t.increments('id').primary();
                t.integer('item')
                    .references('InventoryItem.id');
                t.integer('purchaseOrder')
                    .references('PurchaseOrder.id')
                    .onUpdate('CASCADE')
                    .onDelete('CASCADE');;
                t.integer('count');
            });
        }
    });

    knex.schema.hasTable('PurchaseOrderAttachment').then((exists) => {
        if (!exists) {
            return knex.schema.createTable('PurchaseOrderAttachment', (t) => {
                t.increments('id').primary();
                t.integer('purchaseOrder')
                    .references('PurchaseOrder.id')
                    .onUpdate('CASCADE')
                    .onDelete('CASCADE');
                t.text('attachment');
            });
        }
    });

}


export async function down(knex: Knex): Promise<void> {

    knex.schema.hasTable('InventoryItem').then((exists) => {
        if (exists) {
            return knex.schema.dropTable('InventoryItem');
        }
    });

    knex.schema.hasTable('Label').then((exists) => {
        if (exists) {
            return knex.schema.dropTable('Label');
        }
    });

    knex.schema.hasTable('InventoryItemLabel').then((exists) => {
        if (exists) {
            return knex.schema.dropTable('InventoryItemLabel');
        }
    });

    knex.schema.hasTable('PurchaseOrder').then((exists) => {
        if (exists) {
            return knex.schema.dropTable('PurchaseOrder');
        }
    });

    knex.schema.hasTable('PurchaseOrderItem').then((exists) => {
        if (exists) {
            return knex.schema.dropTable('PurchaseOrderItem');
        }
    });

    knex.schema.hasTable('PurchaseOrderAttachment').then((exists) => {
        if (exists) {
            return knex.schema.dropTable('PurchaseOrderAttachment');
        }
    });

}

