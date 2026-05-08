/** AccessChecksRepository.ts
 * DB operations endpoint for AccessChecks table
 */

import { knex } from "../../knex/index.js";
import { AccessCheckRow } from "../../knex/tables.js";


/**
 * Fetch all Access Checks
 * @returns all AccessChecks
 */
export async function getAccessChecks(): Promise<AccessCheckRow[]> {
    return await knex("AccessChecks").select("*");
}

/**
 * Fetch every Access Checks for the noted user
 * @param userID user ID to filter
 * @returns all relevant Access Checks
 */
export async function getAccessChecksByUserID(userID: number): Promise<AccessCheckRow[] | undefined> {
    return await knex("AccessChecks").select("AccessChecks.*").leftJoin("Equipment", "AccessChecks.equipmentID", "Equipment.id").where({ userID: userID }).orderBy("AccessChecks.approved", "desc").orderBy("Equipment.name", "asc");
}

/**
 * Fetch single Access Check by unique ID
 * @param id ID of the access check
 * @returns AccessCheck or undefined if ID not exist
 */
export async function getAccessCheckByID(id: number): Promise<AccessCheckRow | undefined> {
    return await knex("AccessChecks").select("*").first().where({ id: id });
}

/**
 * Return true if access check exists for noted user and equipment
 * @param userID ID of user to check
 * @param equipmentID ID of equipment to check
 * @returns true if exists
 */
export async function accessCheckExists(userID: number, equipmentID: number): Promise<boolean> {
    return (await knex("AccessChecks").select("*").first().where({ userID: userID, equipmentID: equipmentID })) != undefined;
}

/**
 * Return true if approved access check exists for noted user and equipment
 * @param userID ID of user to check
 * @param equipmentID ID of equipment to check
 * @returns true if exists
 */
export async function hasApprovedAccessCheck(userID: number, equipmentID: number): Promise<boolean | undefined> {
    return (await knex("AccessChecks").select("*").first().where({ userID: userID, equipmentID: equipmentID }))?.approved
}

/**
 * Fetch all access checks with matching approved column
 * @param approved if approved
 * @returns all matching Access Checks
 */
export async function getAccessChecksByApproved(approved: boolean): Promise<AccessCheckRow[]> {
    return await knex("AccessChecks").select("*").where({ approved: approved });
}

/**
 * Insert a new Access Check into the table
 * @param userID userID for the check
 * @param equipmentID equipment ID for the check
 * @returns creaated Access Check
 */
export async function createAccessCheck(userID: number, equipmentID: number, approved?: boolean): Promise<AccessCheckRow> {
    return await knex("AccessChecks").insert({
        userID: userID,
        equipmentID: equipmentID,
        approved: approved ?? false
    });
}

/**
 * Change the 'approved' col of a specified Access Check
 * @param id id of entry to modify
 * @param approved approval state to set
 * @returns updated Access Check or undefined if id not exist
 */
export async function setAccessCheckApproval(id: number, approved: boolean): Promise<AccessCheckRow | undefined> {
    await knex("AccessChecks").update({
        approved: approved
    }).where({ id: id });
    return await getAccessCheckByID(id);
}

/**
 * Return true if approved access check exists for noted user and equipment
 * @param userID ID of user to check
 * @param equipmentID ID of equipment to check
 * @returns true if exists
 */
export async function isApproved(userID: number, equipmentID: number): Promise<boolean> {
    const check = await knex("AccessChecks").select("*").where({ userID: userID, equipmentID: equipmentID }).first();
    if (check?.approved) return true;
    return false;
}

/**
 * Remove all unapproved access checks
 * @param userID user ID to check Access Checks for
 * @returns true
 */
export async function purgeUnapprovedAccessChecks(userID: number): Promise<boolean> {
    await knex("AccessChecks").delete().where({ userID, approved: false });
    return true;
}