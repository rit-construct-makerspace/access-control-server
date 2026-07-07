/**
 * ToolItemTypesRepository.tx
 * DB Operations for Tool Item Types
 */

import { knex } from "../../knex/index.js";
import { ToolItemTypesRow } from "../../knex/tables.js";

/**
 * Fetch all Tool Item Types
 * @returns all Tool Item Types
 */
export async function getToolItemTypes(): Promise<ToolItemTypesRow[]> {
    return await knex("ToolItemTypes").select().orderBy("id");
}

/**
 * Fetch Tool Item Types where checkout is allowed
 * @returns all matching Tool Item Types
 */
export async function getToolItemTypesWhereAllowCheckout(): Promise<ToolItemTypesRow[]> {
    return await knex("ToolItemTypes").select().where({ allowCheckout: true }).orderBy("id");
}

/**
 * Fetch Tool Item Type by ID
 * @param id ID of Tool Item Type
 * @returns Tool Item Type or undefined is not exist
 */
export async function getToolItemTypeByID(id: number): Promise<ToolItemTypesRow | undefined> {
    return await knex("ToolItemTypes").select().where({ id }).first();
}

/**
 * Insert a new Tool Item Type into the table
 * @param name name of the type/model
 * @param defaultLocationRoomID default locationRoomID to apply to new instances under this type
 * @param defaultLocationDescription default defaultLocationDescription to apply to new instances under this type
 * @param description type description
 * @param checkoutNote note to show employees on instance checkout
 * @param checkinNote note to show employyes on instance check-in
 * @param allowCheckout whether instance of this type can be checked out
 * @returns 
 */
export async function createToolItemType(name: string, defaultLocationRoomID: number | undefined, defaultLocationDescription: string | undefined, description: string | undefined, checkoutNote: string | undefined, checkinNote: string | undefined, allowCheckout: boolean): Promise<ToolItemTypesRow> {
    return await knex("ToolItemTypes").insert({ name, defaultLocationRoomID, defaultLocationDescription, description, checkoutNote, checkinNote, allowCheckout });
}

/**
 * Modify an existing Tool Item Type
 * @param id ID of Tool Item Type to modify
 * @param name new name
 * @param defaultLocationRoomID new deafultLocationRoomID
 * @param defaultLocationDescription new defaultLocationDescription
 * @param description new description
 * @param checkoutNote new checkoutNote
 * @param checkinNote new checkinNote
 * @param allowCheckout new allowCheckout
 * @returns updated Tool Item Type or undefined if not exist
 */
export async function updateToolItemType(id: number, name: string, defaultLocationRoomID: number | undefined, defaultLocationDescription: string | undefined, description: string | undefined, checkoutNote: string | undefined, checkinNote: string | undefined, allowCheckout: boolean, imageUrl: string | undefined): Promise<ToolItemTypesRow | undefined> {
    return (await knex("ToolItemTypes").update({
        name,
        defaultLocationRoomID,
        defaultLocationDescription,
        description,
        checkoutNote,
        checkinNote,
        allowCheckout,
        imageUrl
    }).where({ id }).returning("*"))[0];
}

/**
 * Delete an existing Tool Item Type
 * @param id ID of Tool Item Type to delete
 * @returns true
 */
export async function deleteToolItemType(id: number): Promise<boolean> {
    await knex("ToolItemTypes").delete().where({ id });
    return true;
}