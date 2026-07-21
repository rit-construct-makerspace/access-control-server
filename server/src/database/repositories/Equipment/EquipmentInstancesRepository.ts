/**
 * EquipmentInstancesRepository.ts
 * DB Operations for Equipment Instances
 */

import { knex } from "../../knex/index.js";
import { EquipmentInstancesRow, ReaderRow } from "../../knex/tables.js";

/**
 * Fetch all EquipmentInstances related to noted Equipment
 * @param equipmentID ID of equipment to filter by
 * @returns all Instances for noted Equipment
 */
export async function getInstancesByEquipment(equipmentID: number): Promise<EquipmentInstancesRow[]> {
    return await knex("EquipmentInstances").select().where({ equipmentID }).orderBy("name", "asc");
}

/**
 * Fetch an EquipmentInstance by unique ID
 * @param id unique id of EquipmentInstance
 * @returns EquipmentInstance or undefined if not exist
 */
export async function getInstanceByID(id: number): Promise<EquipmentInstancesRow | undefined> {
    return await knex("EquipmentInstances").select().where({ id: id }).first();
}

/**
 * Update an EquipmentInstance by unique ID
 * @param id unique id of EquipmentInstance
 * @returns EquipmentInstance or undefined if not exist
 */
export async function updateInstance(id: number, name: string, status: string): Promise<EquipmentInstancesRow | undefined> {
    return (await knex("EquipmentInstances").update({ name: name, status: status }).where({ id }).returning("*"))[0];
}

/**
 * Update hobbs time of an EquipmentInstance by unique ID
 * @param id unique id of EquipmentInstance
 * @returns EquipmentInstance or undefined if not exist
 */
export async function updateInstanceHobbsTime(id: number, hobbsTime: number): Promise<EquipmentInstancesRow | undefined> {
    return (await knex("EquipmentInstances").update({  hobbsTime: hobbsTime }).where({ id }).returning("*"))[0];
}



/**
 * Fetch an EquipmentInstance by its associate reader ID
 * @param id unique id of reader
 * @returns EquipmentInstance or undefined if not exist
 */
export async function getInstanceByAccessControllerID(accessControllerID: number): Promise<EquipmentInstancesRow | undefined> {
    return await knex("EquipmentInstances").where("accessControllerID", "=", accessControllerID).first();
}

/**
 * Fetch an EquipmentInstance by its associated reader by its device and channel id
 * @param device_id unique id of device
 * @param channel_id unique id of channel
 * @returns EquipmentInstance or undefined if not exist
 */
export async function getInstanceByAccessControllerDeviceAndChannel(deviceId: number, channelId: number): Promise<EquipmentInstancesRow | undefined> {
    return await knex("EquipmentInstances as ei")
        .leftJoin("AccessControllers as ac","accessControllerID", "=", "ac.id")
        .where("ac.deviceID", "=", deviceId)
        .andWhere("ac.channelID", "=", channelId)
        .select("ei.id", "ei.equipmentID", "name", "status", "accessControllerID", "ei.hobbsTime").first();
}

export async function getReaderByInstanceId(instanceID: number): Promise<ReaderRow | undefined> {
    // look up by v2 shlug
    return await knex("Readers").select("Readers.*")
        .leftJoin("EquipmentInstances", "Readers.id", "EquipmentInstances.readerID")
        .where("EquipmentInstances.id", instanceID).first();
}
/**
 * Insert a new EquipmentInstance into table
 * @param equipmentID equipment ID of instance
 * @param name name of instance
 * @returns new EquipmentInstance
 */
export async function createInstance(equipmentID: number, name: string): Promise<EquipmentInstancesRow> {
    return await knex("EquipmentInstances").insert({ equipmentID, name });
}

/**
 * Modify the status column of an EquipmentInstance
 * @param id ID of EquipmentInstance to modify
 * @param status new status to set
 * @returns updated EquipmentInstance
 */
export async function setInstanceStatus(id: number, status: string): Promise<EquipmentInstancesRow> {
    return (await knex("EquipmentInstances").update({ status }).where({ id }).returning("*"))[0];
}

/**
 * Modify the name column of an EquipmentInstance
 * @param id ID of EquipmentInstance to modify
 * @param name new name to set
 * @returns updated EquipmentInstance
 */
export async function setInstanceName(id: number, name: string): Promise<EquipmentInstancesRow> {
    return (await knex("EquipmentInstances").update({ name }).where({ id }).returning("*"))[0];
}

/**
 * Delete a specified EquipmentInstance
 * @param id unique ID of instance to delete
 * @returns true
 */
export async function deleteInstance(id: number): Promise<boolean> {
    await knex("EquipmentInstances").delete().where({ id });
    return true;
}

export async function updateInstanceControllerAssignment(id: number, accessControllerID?: number): Promise<boolean> {
    await knex("EquipmentInstances").update({ accessControllerID: accessControllerID ?? null }).where({ id: id });
    return true;
}