/**
 * InventoryCartsRepository.ts
 * DB Operations for Inventory Carts
 */

import { knex } from "../../db/index.js";
import { InventoryCartsRow, InventoryItemRow, InventoryItemsForCartsRow } from "../../db/tables.js";

export async function getInventoryCarts(): Promise<InventoryCartsRow[]> {
  return await knex("InventoryCarts").select();
}

export async function getInventoryCartByID(cartID: number): Promise<InventoryCartsRow | undefined> {
  return await knex("InventoryCarts").where({ id: cartID }).first();
}

export async function getInventoryCartsByUser(userID: number): Promise<InventoryCartsRow[]> {
  return await knex("InventoryCarts").where({ userID });
}

export async function getInventoryCartsByMakerspace(makerspaceID: number): Promise<InventoryCartsRow[]> {
  return await knex("InventoryCarts").where({ makerspaceID });
}

export async function getInventoryCartByUserMakerspace(userID: number, makerspaceID: number): Promise<InventoryCartsRow | undefined> {
  return await knex("InventoryCarts").where({ userID, makerspaceID }).first();
}

export async function createInventoryCart(userID: number, makerspaceID: number): Promise<InventoryCartsRow> {
  const [newCart] = await knex("InventoryCarts").insert({ userID, makerspaceID }).returning("*");
  return newCart;
}

export async function deleteInventoryCart(cartID: number): Promise<void> {
  await knex("InventoryCarts").where({ id: cartID }).delete();
}

/**
 * Inventory Items For Carts ===
 */

export async function getItemsInCart(cartID: number): Promise<InventoryItemRow[]> {
  return await knex("InventoryItemsForCarts").where({ cartID }).join("InventoryItems", "InventoryItemsForCarts.itemID", "InventoryItems.id");
}

export async function addItemsToCart(cartID: number, items: { itemID: number; quantity: number }[]): Promise<void> {
  await knex("InventoryItemsForCarts").insert(
    items.map(item => ({
      cartID,
      itemID: item.itemID,
      count: item.quantity
    }))
  );
}

export async function updateItemAmounts(cartID: number, items: { itemID: number; quantity: number }[]): Promise<void> {
  await Promise.all(
    items.map(item =>
      knex("InventoryItemsForCarts")
        .where({ cartID, itemID: item.itemID })
        .update({ count: item.quantity })
    )
  );
}

export async function subtractItemFromCart(cartID: number, itemID: number, quantity: number): Promise<boolean> {
  const result = await knex("InventoryItemsForCarts")
    .where({ cartID, itemID })
    .decrement("count", quantity)
    .returning("count");

  return (result[0]?.count ?? 0) > 0;
}

//This one might abuse the connection limit. Unclear how knex manages concurrency.
export async function addOrUpdateItemsInCart(cartID: number, items: { itemID: number; quantity: number }[]): Promise<void> {
  await Promise.all(
    items.map(item =>
      knex("InventoryItemsForCarts")
        .insert({ cartID, itemID: item.itemID, count: item.quantity })
        .onConflict(["cartID", "itemID"])
        .merge()
    )
  );
}
