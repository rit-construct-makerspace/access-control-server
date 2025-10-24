/**
 * MaintenanceLogrepository.ts
 * DB Operations for Maintenance Logs, Resolution Logs, and Maintenance Tags
 */

import { knex } from "../../db/index.js";
import { MaintenanceLogRow, MaintenanceTagRow, ResolutionLogRow } from "../../db/tables.js";

/**
 * Insert a new maintenance log into the table
 * @param authorID ID of creating user
 * @param equipmentID ID of assocaited equipment
 * @param instanceID ID of assocaited equipment instance or null
 * @param content issue description
 * @returns new Maintenance Log
 */
export async function createMaintenanceLog(authorID: number, equipmentID: number, instanceID: number | undefined, content: string): Promise<MaintenanceLogRow> {
    return await knex("MaintenanceLogs").insert({authorID, equipmentID, instanceID, content});
}

/**
 * Delete a Maintenance Log
 * @param id ID of entry to delete
 * @returns true
 */
export async function deleteMaintenanceLog(id: number): Promise<boolean> {
    await knex("MaintenanceLogs").delete().where({id});
    return true;
}

/**
 * Edit an existing Maintenance Log
 * @param id ID of maintenance log to modify
 * @param content new content
 * @param tagID1 new MaintenanceTag ID or null
 * @param tagID2 new MaintenanceTag ID or null
 * @param tagID3 new MaintenanceTag ID or null
 * @returns updated Maintenance Log or undefined if ID not exist
 */
export async function updateMaintenanceLog(id: number, content: string, tagID1: number, tagID2: number, tagID3: number): Promise<MaintenanceLogRow | undefined> {
    return (await knex("MaintenanceLogs").update({content, tagID1, tagID2, tagID3}).where({id}).returning("*"))[0];
}

/**
 * Fetch all maintenance logs for a noted equipment
 * @param equipmentID ID of equipment to filter by
 * @returns all matching MaintenanceLogs
 */
export async function getMaintenanceLogsByEquipment(equipmentID: number): Promise<MaintenanceLogRow[]> {
    return (await knex("MaintenanceLogs").select().where({equipmentID}).orderBy("timestamp", "asc"));
}

/**
 * Fetch a Maintenance Log
 * @param id ID of maintenance log to fetch
 * @returns Maintenance Log or undefined if ID not exist
 */
export async function getMaintenanceLogByID(id: number): Promise<MaintenanceLogRow | undefined> {
    return await knex("MaintenanceLogs").select().where({id}).first();
}

/**
 * Insert a new resolution log into the table
 * @param authorID ID of creating user
 * @param equipmentID ID of assocaited equipment
 * @param instanceID ID of assocaited equipment instance or null
 * @param issue issue description
 * @param content resolution description
 * @returns new Maintenance Log
 */
export async function createResolutionLog(authorID: number, equipmentID: number, instanceID: number | undefined, issue: string, content: string): Promise<ResolutionLogRow> {
    return await knex("ResolutionLogs").insert({authorID, equipmentID, instanceID, issue, content});
}

/**
 * Delete a Resolution Log
 * @param id ID of resolution log to delete
 * @returns true
 */
export async function deleteResolutionLog(id: number): Promise<boolean> {
    await knex("ResolutionLogs").delete().where({id});
    return true;
}

/**
 * Fetch all Resolution Logs associated with a noted equipment
 * @param equipmentID equipment ID to filter by
 * @returns all matching Resolution Logs
 */
export async function getResolutionLogsByEquipment(equipmentID: number): Promise<ResolutionLogRow[]> {
    return await knex("ResolutionLogs").select().where({equipmentID}).orderBy("timestamp", "asc");
}

/**
 * Fetch a Resolution Log
 * @param id ID of resolution log to fetch
 * @returns resolution Log or undefined if ID not exist
 */
export async function getResolutionLogByID(id: number): Promise<ResolutionLogRow | undefined> {
    return await knex("ResolutionLogs").select().where({id}).first();
}

/**
 * Edit an existing Resolution Log
 * @param id ID of resolution log to modify
 * @param issue new issue description
 * @param content new content
 * @param tagID1 new MaintenanceTag ID or null
 * @param tagID2 new MaintenanceTag ID or null
 * @param tagID3 new MaintenanceTag ID or null
 * @returns updated Resolution Log or undefined if ID not exist
 */
export async function updateResolutionLog(id: number, issue: string, content: string, tagID1: number, tagID2: number, tagID3: number): Promise<ResolutionLogRow | undefined> {
    return (await knex("ResolutionLogs").update({issue, content, tagID1, tagID2, tagID3}).where({id}).returning("*"))[0];
}

/**
 * Insert a new Maintenance Tag into the table
 * @param equipmentID ID of related equipment or null if global
 * @param label tag label text
 * @param color React color type string
 * @returns new Maintenance Tag
 */
export async function createMaintenanceTag(equipmentID: number | null, label: string, color: string,): Promise<MaintenanceTagRow> {
    return await knex("MaintenanceTags").insert({equipmentID: equipmentID ?? undefined, label, color});
}

/**
 * Edit an existing maintenance tag
 * @param id ID of maintenance tag of tag to modify
 * @param label new label text
 * @param color new color string
 * @returns updated maintenance tag
 */
export async function updateMaintenanceTag(id: number, label: string, color: string): Promise<MaintenanceTagRow | undefined> {
    await knex("MaintenanceTags").update({label, color}).where({id});
    return await getMaintenanceTagByID(id);
}

/**
 * Delete a maintenance tag
 * @param id ID of maintenance tag to delete
 * @returns true
 */
export async function deleteMaintenanceTag(id: number): Promise<boolean> {
    await knex("MaintenanceTags").delete().where({id});
    return true;
}

/**
 * Fetch all maintenance tags
 * @returns all Maintenance Tags
 */
export async function getMaintenanceTags(): Promise<MaintenanceTagRow[]> {
    return await knex("MaintenanceTags").select().orderBy("id", "asc");
}

/**
 * Fetch all maintenance tags with noted equipment ID or no equipment ID
 * @param equipmentID ID of equipment to filter by
 * @returns all matching maintenance tags
 */
export async function getMaintenanceTagsByEquipmentOrGlobal(equipmentID: number): Promise<MaintenanceTagRow[]> {
    return await knex("MaintenanceTags").select().where({equipmentID}).orWhereNull("equipmentID").orderBy("id", "asc");
}

/**
 * Fetch a maintenance tag
 * @param id ID of maintenance tag
 * @returns maintenance tag
 */
export async function getMaintenanceTagByID(id: number): Promise<MaintenanceTagRow | undefined> {
    return await knex("MaintenanceTags").select().where({id}).first();
}