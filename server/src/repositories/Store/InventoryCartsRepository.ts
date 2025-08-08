/**
 * InventoryCartsRepository.ts
 * DB Operations for Inventory Carts
 */

import { knex } from "../../db/index.js";
import { InventoryCartsRow } from "../../db/tables.js";

export async function getInventoryCarts(): Promise<InventoryCartsRow[]> {
  return await knex("InventoryCarts").select();
}

export async function getInventoryCartsByID(cartID: number): Promise<InventoryCartsRow[]> {
  return await knex("InventoryCarts").where({ id: cartID });
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

export async function getItemsInCart(cartID: number): Promise<{ itemID: number; quantity: number }[]> {
  return await knex("InventoryItemsForCarts").where({ cartID });
}

export async function addItemsToCart(cartID: number, items: { itemID: number; quantity: number }[]): Promise<void> {
  await knex("InventoryItemsForCarts").insert(
    items.map(item => ({
      cartID,
      itemID: item.itemID,
      quantity: item.quantity
    }))
  );
}

export async function updateItemAmounts(cartID: number, items: { itemID: number; quantity: number }[]): Promise<void> {
  await Promise.all(
    items.map(item =>
      knex("InventoryItemsForCarts")
        .where({ cartID, itemID: item.itemID })
        .update({ quantity: item.quantity })
    )
  );
}

//This one might abuse the connection limit. Unclear how knex manages concurrency.
export async function addOrUpdateItemsInCart(cartID: number, items: { itemID: number; quantity: number }[]): Promise<void> {
  await Promise.all(
    items.map(item =>
      knex("InventoryItemsForCarts")
        .insert({ cartID, itemID: item.itemID, quantity: item.quantity })
        .onConflict(["cartID", "itemID"])
        .merge()
    )
  );
}
