/** InventoryRepository.ts
 * DB operations endpoint for Holds table
 */

import { knex } from "../../db/index.js";
import { InventoryTagRow } from "../../db/tables.js";
import { EntityNotFound } from "../../EntityNotFound.js";
import {
  inventoryItemsToDomain,
  singleInventoryItemToDomain,
} from "../../mappers/store/InventoryItemMapper.js";
import {
  InventoryItem,
  InventoryItemInput,
} from "../../schemas/storeFrontSchema.js";

/**
 * Fetch all Inventory Items
 * @returns all InventoryItems
 */
export async function getItems(makerspaceID?: number): Promise<InventoryItem[]> {
  const knexResult = knex("InventoryItem").select().where('archived', false);
  if (makerspaceID) {
    knexResult.where('makerspaceID', makerspaceID);
  }

  return inventoryItemsToDomain(await knexResult);
}

/**
 * Fetch Inventory Items by Multiple IDs
 * @param itemIds IDs of Inventory Items to find
 * @returns matching Inventory Items
 */
export async function getItemsByID(itemIds: number[]): Promise<InventoryItem[]> {
  const knexResult = knex("InventoryItem").select().whereIn("id", itemIds);
  return inventoryItemsToDomain(await knexResult);
}

/**
 * Fetch Inventory Items by "staffOnly" column
 * @param staffOnly whether to fetch staffOnly items or not staffOnly items
 * @returns matching Inventory Items
 */
export async function getItemsWhereStaff(staffOnly: boolean, makerspaceID?: number): Promise<InventoryItem[]> {
  const knexResult = knex("InventoryItem").select().where({ staffOnly });
  if (makerspaceID) {
    knexResult.where('makerspaceID', makerspaceID);
  }
  return inventoryItemsToDomain(await knexResult);
}

/**
 * Fetch Inventory Items by "storefrontVisible" column
 * @param storefrontVisible 
 * @returns matching Inventory Items
 */
export async function getItemsWhereStorefront(storefrontVisible: boolean, makerspaceID?: number): Promise<InventoryItem[]> {
  const knexResult = knex("InventoryItem").select().where({ storefrontVisible });
  if (makerspaceID) {
    knexResult.where('makerspaceID', makerspaceID);
  }
  return inventoryItemsToDomain(await knexResult);
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
): Promise<InventoryItem | null> {
  return singleInventoryItemToDomain(await knex("InventoryItem").select().where({ id, storefrontVisible }));
}

/**
 * Fetch Inventory Item by ID
 * @param itemId ID of Inventory Item
 * @returns Inventory Item
 */
export async function getItemById(
  itemId: number
): Promise<InventoryItem | null> {
  const knexResult = await knex
    .first()
    .from("InventoryItem")
    .where("id", itemId);

  return singleInventoryItemToDomain(knexResult);
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
): Promise<InventoryItem | null> {
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

  return await getItemById(itemId);
}

/**
 * Insert a new Inventory Item into table
 * @param item InventoryItemInput with new attributes
 * @returns new InventoryItem
 */
export async function addItem(
  item: InventoryItemInput
): Promise<InventoryItem | null> {
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
  return await getItemById(newId.id);
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
): Promise<InventoryItem | null> {
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

  return await getItemById(updateItem.id);
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
): Promise<InventoryItem | null> {
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

  return await getItemById(updateItem.id);
}

/**
 * Archive an Inventory Item
 * @param itemId ID of Inventory Item to archive
 * @returns updated Inventory Item
 */
export async function archiveItem(
  itemId: number
): Promise<InventoryItem | null> {
  let updatedInventoryItems: InventoryItem[] = await knex("InventoryItem").where({ id: itemId }).update({ archived: true });

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
export async function getTagByID(id: number): Promise<InventoryTagRow | undefined> {
  return await knex("InventoryTags").select().where({ id }).first();
}

/**
 * Add a tag to an existing inventory item
 * @param itemID ID of inventory item to modify
 * @param tagID ID of Inventory Tag to apply
 * @returns true or false if max amount of tags already
 */
export async function addTagToItem(itemID: number, tagID: number): Promise<boolean> {
  const item = await knex("InventoryItem").select().where({ id: itemID }).first();
  if (!item?.tagID1) await knex("InventoryItem").update({ tagID1: tagID }).where({ id: itemID });
  else if (!item?.tagID2) await knex("InventoryItem").update({ tagID2: tagID }).where({ id: itemID });
  else if (!item?.tagID3) await knex("InventoryItem").update({ tagID3: tagID }).where({ id: itemID });
  else return false;
  return true;
}

/**
 * Remove an inventory tag reference from an Inventory Item
 * @param itemID ID of inventory item to modify
 * @param tagID ID of tag to remove from entry
 * @returns true
 */
export async function removeTagFromItem(itemID: number, tagID: number): Promise<boolean> {
  const item = await knex("InventoryItem").select().where({ id: itemID }).first();
  if (item?.tagID1 == tagID) await knex("InventoryItem").update({ tagID1: null }).where({ id: itemID });
  else if (item?.tagID2 == tagID) await knex("InventoryItem").update({ tagID2: null }).where({ id: itemID });
  else if (item?.tagID3 == tagID) await knex("InventoryItem").update({ tagID3: null }).where({ id: itemID });
  return true;
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

export async function updateMakerspace(id: number, makerspaceID: number): Promise<boolean> {
  await knex("InventoryItem").update({ makerspaceID }).where({ id });
  return true;
}