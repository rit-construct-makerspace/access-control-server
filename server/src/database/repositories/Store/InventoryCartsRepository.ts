/**
 * InventoryCartsRepository.ts
 * DB Operations for Inventory Carts
 */

import { knex } from "../../knex/index.js";
import { InventoryCartsRow, InventoryItemRow } from "../../knex/tables.js";

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
  const [newCart] = await knex("InventoryCarts").insert({ userID, makerspaceID, lastModified: knex.fn.now() }).returning("*");
  return newCart;
}

export async function deleteInventoryCart(cartID: number): Promise<void> {
  await knex("InventoryCarts").where({ id: cartID }).delete();
}

export async function updateInventoryCartTimestamp(cartID: number): Promise<void> {
  await knex("InventoryCarts").where({ id: cartID }).update({ lastModified: knex.fn.now() });
}

/**
 * Inventory Items For Carts ===
 */

interface ItemInCartRow extends InventoryItemRow {
  cartcount: number;
}

export async function getItemsInCart(cartID: number): Promise<ItemInCartRow[]> {
  return await knex("InventoryItemsForCarts").where({ cartID }).select("InventoryItem.*", "InventoryItemsForCarts.count AS cartcount").join("InventoryItem", "InventoryItemsForCarts.itemID", "InventoryItem.id");
}

export async function addItemsToCart(cartID: number, items: { itemID: number; quantity: number }[]): Promise<void> {
  await knex("InventoryItemsForCarts").insert(
    items.map(item => ({
      cartID,
      itemID: item.itemID,
      count: item.quantity
    }))
  );
  await updateInventoryCartTimestamp(cartID);
}

export async function updateItemAmounts(cartID: number, items: { itemID: number; quantity: number }[]): Promise<void> {
  await Promise.all(
    items.map(item =>
      knex("InventoryItemsForCarts")
        .where({ cartID, itemID: item.itemID })
        .update({ count: item.quantity })
    )
  );
  await updateInventoryCartTimestamp(cartID);
}

export async function subtractItemFromCart(cartID: number, itemID: number, quantity: number): Promise<boolean> {
  const result = await knex("InventoryItemsForCarts")
    .where({ cartID, itemID })
    .decrement("count", quantity)
    .returning("count");

  await updateInventoryCartTimestamp(cartID);

  return (result[0]?.count ?? 0) > 0;
}

export async function addOrUpdateItemsInCart(cartID: number, items: { itemID: number; quantity: number }[]): Promise<void> {
  await knex.transaction(async trx => {
    for (const item of items) {
      await trx("InventoryItemsForCarts")
        .insert({ cartID, itemID: item.itemID, count: item.quantity })
        .onConflict(["cartID", "itemID"])
        .merge();
    }

    await updateInventoryCartTimestamp(cartID);
  });
}

export async function clearItemsFromCart(cartID: number): Promise<void> {
  await knex("InventoryItemsForCarts").where({ cartID }).delete();
  await updateInventoryCartTimestamp(cartID);
}
