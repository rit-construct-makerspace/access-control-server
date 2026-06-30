/**
 * ToolITemInstanceRepository.ts
 * DB Operations for Tool Item Instances
 */

import { knex } from "../../knex/index.js";
import { ToolItemInstancesRow } from "../../knex/tables.js";

/**
 * Fetch all Tool Item Instances
 * @returns all Tool Item Instances
 */
export async function getToolItemInstances(): Promise<ToolItemInstancesRow[]> {
    return await knex("ToolItemInstances").select().orderBy("id");
}

/**
 * Fetch Tool Item Instances associated with a noted Tool Item Type
 * @param typeID Id of Tool Item Type to filter by
 * @returns all matching Tool Item Instances
 */
export async function getToolItemInstancesByType(typeID: number): Promise<ToolItemInstancesRow[]> {
    return await knex("ToolItemInstances").select().where({ typeID }).orderBy("id");
}

/**
 * Get Tool Item Instance by ID
 * @param id ID of Tool Item Instance
 * @returns Tool Item Instance
 */
export async function getToolItemInstanceByID(id: number): Promise<ToolItemInstancesRow | undefined> {
    return await knex("ToolItemInstances").select().where({ id }).first();
}

/**
 * Fetch Tool Item Instances by borrower
 * @param borrowerUserID ID of borrowing User to filter by
 * @returns all matching Tool Item Instances
 */
export async function getToolItemInstancesByBorrower(borrowerUserID: number): Promise<ToolItemInstancesRow[]> {
    return await knex("ToolItemInstances").select().where({ borrowerUserID });
}

/**
 * Insert new Tool Item Instance into table
 * @param typeID ID of Tool Item Type
 * @param uniqueIdentifier Instance name
 * @param locationRoomID room instance is stored in or undefined
 * @param locationDescription description of item's location or undefined
 * @param condition text represention item's qualititative condition
 * @param status text representing item's availability status
 * @param notes text
 * @returns new ToolItemInstance
 */
export async function createToolItemInstance(typeID: number, uniqueIdentifier: string, locationRoomID: number | undefined, locationDescription: string | undefined, condition: string, status: string, notes: string | undefined): Promise<ToolItemInstancesRow> {
    return await knex("ToolItemInstances").insert({ typeID, uniqueIdentifier, locationRoomID, locationDescription, condition, status, notes });
}

/**
 * Modify Existing Tool Item Instance
 * @param id ID of Tool Item Instance to modify
 * @param typeID new ID of Tool Item Type
 * @param uniqueIdentifier new uniqueIdentifier
 * @param locationRoomID new locationRoomID
 * @param locationDescription new locationDescription
 * @param condition new condition
 * @param status new status
 * @param notes new notes
 * @returns updated Tool Item Instance
 */
export async function updateToolItemInstance(id: number, typeID: number, uniqueIdentifier: string, locationRoomID: number | undefined, locationDescription: string | undefined, condition: string, status: string, notes: string | undefined): Promise<ToolItemInstancesRow | undefined> {
    return (await knex("ToolItemInstances").update({ typeID, uniqueIdentifier, locationRoomID, locationDescription, condition, status, notes }).where({ id }).returning("*"))[0];
}

/**
 * Delete a Tool Item Instance
 * @param id ID of Tool Item Instance to delete
 * @returns true
 */
export async function deleteToolItemInstance(id: number): Promise<boolean> {
    await knex("ToolItemInstances").delete().where({ id });
    return true;
}

/**
 * Mark a Tool Item Instance as borrowed by a specified User
 * @param borrowerUserID ID of user the Tool Item Instance is being checked out to
 * @param id ID of Tool Item Instance being checked out
 * @returns true
 */
export async function borrowItem(borrowerUserID: number, id: number): Promise<boolean> {
    await knex("ToolItemInstances").update({ borrowerUserID, borrowedAt: knex.fn.now(), status: "OUT" }).where({ id });
    return true;
}

/**
 * Mark a Tool Item Instance as returned and remove reference to the borrrower User
 * @param id ID of Tool Item Instance being returned
 * @returns true
 */
export async function returnItem(id: number): Promise<boolean> {
    await knex("ToolItemInstances").update({ borrowerUserID: null, borrowedAt: null, status: "AVAILABLE" }).where({ id });
    return true;
}