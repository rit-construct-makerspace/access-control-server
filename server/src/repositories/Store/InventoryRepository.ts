/** InventoryRepository.ts
 * DB operations endpoint for Holds table
 */

import { knex } from "../../db/index.js";
import { InventoryItemRow, InventoryTagRow } from "../../db/tables.js";
import { EntityNotFound } from "../../EntityNotFound.js";

import {
  InventoryItem,
  InventoryItemInput,
} from "../../schemas/storeFrontSchema.js";

/**
 * Fetch all Inventory Items
 * @returns all InventoryItems
 */
export async function getItems(makerspaceID?: number): Promise<InventoryItemRow[]> {
  let query = knex("InventoryItem").select().where('archived', false);
  if (makerspaceID) {
    query = query.where('makerspaceID', makerspaceID);
  }
  return await query;
}

/**
 * Fetch Inventory Items by Multiple IDs
 * @param itemIds IDs of Inventory Items to find
 * @returns matching Inventory Items
 */
export async function getItemsByID(itemIds: number[]): Promise<InventoryItemRow[]> {
  const knexResult = knex("InventoryItem").select().whereIn("id", itemIds);
  return (await knexResult);
}

/**
 * Fetch Inventory Items by "staffOnly" column
 * @param staffOnly whether to fetch staffOnly items or not staffOnly items
 * @returns matching Inventory Items
 */
export async function getItemsWhereStaff(staffOnly: boolean, makerspaceID?: number): Promise<InventoryItemRow[]> {
  const knexResult = knex("InventoryItem").select().where({ staffOnly });
  if (makerspaceID) {
    knexResult.where('makerspaceID', makerspaceID);
  }
  return (await knexResult);
}

/**
 * Fetch Inventory Items by "storefrontVisible" column
 * @param storefrontVisible 
 * @returns matching Inventory Items
 */
export async function getItemsWhereStorefront(storefrontVisible: boolean, makerspaceID?: number): Promise<InventoryItemRow[]> {
  const knexResult = knex("InventoryItem").select().where({ storefrontVisible });
  if (makerspaceID) {
    knexResult.where('makerspaceID', makerspaceID);
  }
  return (await knexResult);
}

/**
 * Get Inventory Item if matching storefrontVisible column
 * @param id ID of Inventory Item to find
 * @param storefrontVisible storefrontVisible column to filter by
 * @returns InventoryItem or null if not found
 */
export async function getItemByIdWhereStorefront(
  id: number,
  storefrontVisible: boolean
): Promise<InventoryItemRow | null> {
  return (await knex("InventoryItem").select().where({ id, storefrontVisible }).first()) ?? null;
}

/**
 * Fetch Inventory Item by ID
 * @param itemId ID of Inventory Item
 * @returns Inventory Item
 */
export async function getItemById(
  itemId: number
): Promise<InventoryItemRow | null> {
  const knexResult = await knex
    .first()
    .from("InventoryItem")
    .where("id", itemId);

  return knexResult ?? null;
}

/**
 * Modify an existing Inventory Item
 * @param itemId ID of Inventory Item to modify
 * @param item InventoryItemInput with new attributes
 * @returns updated Inventory Item
 */
export async function updateItemById(
  itemId: number,
  item: InventoryItemInput
): Promise<InventoryItemRow | null> {
  await knex("InventoryItem").where({ id: itemId }).update({
    name: item.name,
    image: item.image,
    unit: item.unit,
    pluralUnit: item.pluralUnit,
    count: item.count,
    pricePerUnit: item.pricePerUnit,
    threshold: item.threshold,
    notes: item.notes,
    description: item.description,
    makerspaceID: item.makerspaceID,
  });

  return await getItemById(itemId) ?? null;
}

/**
 * Insert a new Inventory Item into table
 * @param item InventoryItemInput with new attributes
 * @returns new InventoryItem
 */
export async function addItem(
  item: InventoryItemInput
): Promise<InventoryItemRow | null> {
  const newId = (
    await knex("InventoryItem").insert(
      {
        image: item.image,
        name: item.name,
        unit: item.unit,
        pluralUnit: item.pluralUnit,
        count: item.count,
        pricePerUnit: item.pricePerUnit,
        threshold: item.threshold,
        notes: item.notes,
        description: item.description,
        makerspaceID: item.makerspaceID,
      },
      "id"
    )
  )[0];
  return await getItemById(newId.id) ?? null;
}

/**
 * Modify the count of an existing InventoryItem
 * @param itemId ID of item to modify amount to
 * @param amount amount modify by
 * @returns modified Inventory Item
 */
export async function addItemAmount(
  itemId: number,
  amount: number
): Promise<InventoryItemRow | null> {
  const updateItem = (
    await knex("InventoryItem")
      .where({ id: itemId })
      .update(
        {
          count: knex.raw(`?? + ${amount}`, ["count"]),
        },
        "id"
      )
  )[0];

  return await getItemById(updateItem.id) ?? null;
}

export async function addItemsAmounts(
  items: { itemId: number; amount: number }[]
): Promise<InventoryItem[]> {
  return knex.transaction(async (trx) => {
    const updatedItems: InventoryItem[] = [];
    for (const item of items) {
      await trx("InventoryItem")
        .where({ id: item.itemId })
        .update(
          {
            count: knex.raw(`?? + ${item.amount}`, ["count"]),
          },
          "id"
        );
    }
    return updatedItems;
  });
}

/**
 * Set the count of an existing InventoryItem
 * @param itemId ID of item to modify amount to
 * @param amount amount set
 * @returns modified Inventory Item
 */
export async function setItemAmount(
  itemId: number,
  amount: number
): Promise<InventoryItemRow | null> {
  const updateItem = (
    await knex("InventoryItem")
      .where({ id: itemId })
      .update(
        {
          count: amount,
        },
        "id"
      )
  )[0];

  return await getItemById(updateItem.id) ?? null;
}

/**
 * Archive an Inventory Item
 * @param itemId ID of Inventory Item to archive
 * @returns updated Inventory Item
 */
export async function archiveItem(
  itemId: number
): Promise<InventoryItemRow | null> {
  const updatedInventoryItems: InventoryItemRow[] = await knex("InventoryItem").where({ id: itemId }).update({ archived: true });
  if (updatedInventoryItems.length < 1) throw new EntityNotFound(`Could not find inventory item #${itemId}`);

  return updatedInventoryItems[0];
}

/**
 * Delete an Inventory Item
 * @param itemId ID of item to delete
 * @returns true
 */
export async function deleteInventoryItem(
  itemId: number
): Promise<boolean> {
  await knex("InventoryItem").where({ id: itemId }).delete()
  return true
}

/**
 * Update storefrontVisible column of Inventory Item
 * @param id ID of inventory item to update
 * @param storefrontVisible new storefrontVisible value
 * @returns true
 */
export async function setStorefrontVisible(id: number, storefrontVisible: boolean): Promise<boolean> {
  await knex("InventoryItem").update({ storefrontVisible }).where({ id });
  return true;
}

/**
 * Update staffOnly column of Inventory Item
 * @param id ID of Inventory to modify
 * @param staffOnly new staffOnly value
 * @returns true
 */
export async function setStaffOnly(id: number, staffOnly: boolean): Promise<boolean> {
  await knex("InventoryItem").update({ staffOnly }).where({ id });
  return true;
}

/**
 * Fetch all Inventory Tags
 * @returns all Inventory Tags
 */
export async function getTags(): Promise<InventoryTagRow[]> {
  return await knex("InventoryTags").select();
}

/**
 * Fetch Inventory Tag
 * @param id ID of Inventory Tag to fetch
 * @returns Inventory Tag or undefined if not exist
 */
export async function getTagByID(id: number): Promise<InventoryTagRow | null> {
  return await knex("InventoryTags").select().where({ id }).first() ?? null;
}

/**
 * Add a tag to an existing inventory item
 * @param itemID ID of inventory item to modify
 * @param tagID ID of Inventory Tag to apply
 * @returns true or false if max amount of tags already
 */
export async function addTagToItem(itemID: number, tagID: number): Promise<boolean> {
  const result = await knex("InventoryItemTagRelations").insert({ itemID: itemID, tagID: tagID }).returning("*");
  return result.length > 0;
}

/**
 * Remove an inventory tag reference from an Inventory Item
 * @param itemID ID of inventory item to modify
 * @param tagID ID of tag to remove from entry
 * @returns true
 */
export async function removeTagFromItem(itemID: number, tagID: number): Promise<boolean> {
  const result = await knex("InventoryItemTagRelations").where({ itemID: itemID, tagID: tagID }).delete();
  return result > 0;
}

export async function getItemTags(itemID: number): Promise<InventoryTagRow[]> {
  return await knex("InventoryItemTagRelations").join("InventoryTags", "InventoryItemTagRelations.tagID", "InventoryTags.id")
    .select("InventoryTags.*").where({ itemID: itemID });
}

/**
 * Insert a new Inventory Tag into the table
 * @param label new label text
 * @param color new React color string
 * @returns true
 */
export async function createTag(label: string, color: string): Promise<boolean> {
  await knex("InventoryTags").insert({ label, color });
  return true;
}

/**
 * Modify an existing Inventory Tag
 * @param label new label text
 * @param color new React color string
 * @returns true
 */
export async function updateTag(id: number, label: string, color: string): Promise<boolean> {
  await knex("InventoryTags").update({ label, color }).where({ id });
  return true
}

/**
 * Delte an Inventory Tag
 * @param id Id of Inventory Tag to delete
 * @returns true
 */
export async function deleteTag(id: number): Promise<boolean> {
  await knex("InventoryTags").delete().where({ id });
  return true;
}

export async function updateMakerspaceForItem(id: number, makerspaceID: number): Promise<boolean> {
  await knex("InventoryItem").update({ makerspaceID }).where({ id });
  return true;
}