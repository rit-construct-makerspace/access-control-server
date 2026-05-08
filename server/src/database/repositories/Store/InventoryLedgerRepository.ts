/**
 * InventoryLedgerRepository.ts
 * DB Operations for Inventory Ledgers
 */

import { knex } from "../../knex/index.js";
import { InventoryLedgerRow } from "../../knex/tables.js";
import { InventoryItem } from "../../schemas/storeFrontSchema.js";

/**
 * Get the first 100 Inventory Ledgers by search params
 * @param startDate earliest date to filter by
 * @param stopDate latest date to filter by
 * @param searchText text to inclusively filter by
 * @param limit the maximum number of ledger entries shown
 * @returns all matching Inventory Ledger rows
 */
export async function getLedgers(
  startDate: string,
  stopDate: string,
  searchText: string,
  limit: number = 100
): Promise<InventoryLedgerRow[]> {
  return await knex("InventoryLedger")
    .select()
    .whereRaw(`("timestamp" at time zone 'EST5EDT') BETWEEN TIMESTAMP '${startDate}' AND TIMESTAMP '${stopDate}'`)
    .whereRaw(searchText != "" ? `items::TEXT ilike %${searchText}%` : ``)
    .orderBy("timestamp", "DESC")
    .limit(limit);
}

/**
 * Delete an Inventory Ledger
 * @param id ID of Inventory Ledger to delete
 * @returns true
 */
export async function deleteLedger(id: number): Promise<boolean> {
  await knex("InventoryLedger").delete().where({ id });
  return true;
}

/**
 * Insert new Inventory Ledger into table
 * @param initiator ID of user who caused to ledger
 * @param category string representing action type
 * @param totalCost total change caused by action
 * @param purchaser ID of user who purchased items, or null if not purchase
 * @param notes text description
 * @param items JSON array of affected item names and counts
 * @returns new Inventory Ledger
 */
export async function createLedger(
  initiator: number | undefined,
  category: string,
  totalCost: number,
  purchaser: number | undefined,
  notes: string,
  items: { name: string; quantity: number }[]
): Promise<InventoryLedgerRow> {
  const itemsJSON = JSON.stringify(items);
  return await knex("InventoryLedger").insert({
    timestamp: knex.fn.now(),
    initiator,
    category,
    totalCost,
    purchaser,
    notes,
    items: itemsJSON,
  });
}
