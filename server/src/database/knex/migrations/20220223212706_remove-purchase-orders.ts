import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .dropTable("PurchaseOrderAttachment")
    .dropTable("PurchaseOrderItem")
    .dropTable("PurchaseOrder");
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.hasTable("PurchaseOrder").then((exists) => {
    if (!exists) {
      return knex.schema.createTable("PurchaseOrder", (t) => {
        t.increments("id").primary();
        t.text("creator");
        t.date("createDate");
        t.date("expectedDeliveryDate");
      });
    }
  });

  knex.schema.hasTable("PurchaseOrderItem").then((exists) => {
    if (!exists) {
      return knex.schema.createTable("PurchaseOrderItem", (t) => {
        t.increments("id").primary();
        t.integer("item").references("InventoryItem.id");
        t.integer("purchaseOrder")
          .references("PurchaseOrder.id")
          .onUpdate('CASCADE')
          .onDelete("CASCADE");
        t.integer("count");
      });
    }
  });

  knex.schema.hasTable("PurchaseOrderAttachment").then((exists) => {
    if (!exists) {
      return knex.schema.createTable("PurchaseOrderAttachment", (t) => {
        t.increments("id").primary();
        t.integer("purchaseOrder")
          .references("PurchaseOrder.id")
          .onUpdate('CASCADE')
          .onDelete("CASCADE");
        t.text("attachment");
      });
    }
  });
}
