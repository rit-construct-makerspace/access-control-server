/**
 * EquipmentInstancesRepository.ts
 * DB Operations for Equipment Instances
 */

import { knex } from "../../db/index.js";
import { EquipmentInstancesRow, ReaderRow } from "../../db/tables.js";
import { getReaderByID } from "../Readers/ReaderRepository.js";

/**
 * Fetch all EquipmentInstances related to noted Equipment
 * @param equipmentID ID of equipment to filter by
 * @returns all Instances for noted Equipment
 */
export async function getInstancesByEquipment(equipmentID: number): Promise<EquipmentInstancesRow[]> {
    return await knex("EquipmentInstances").select().where({ equipmentID }).orderBy("name", "asc");
}

/**
 * Fetch an EquipmentInstance by unqiue ID
 * @param id unique id of EquipmentInstance
 * @returns EquipmentInstance or undefined if not exist
 */
export async function getInstanceByID(id: number): Promise<EquipmentInstancesRow | undefined> {
    return await knex("EquipmentInstances").select().where({ id: id }).first();
}

/**
 * Fetch an EquipmentInstance by unqiue ID
 * @param id unique id of EquipmentInstance
 * @returns EquipmentInstance or undefined if not exist
 */
export async function updateInstance(id: number, name: string, status: string, readerID: number | null): Promise<EquipmentInstancesRow | undefined> {
    return (await knex("EquipmentInstances").update({ name: name, status: status, readerID: readerID }).where({ id }).returning("*"))[0];
}


/**
 * Fetch an EquipmentInstance by its associate reader ID
 * @param id unique id of reader
 * @returns EquipmentInstance or undefined if not exist
 */
export async function getInstanceByReaderID(readerID: number): Promise<EquipmentInstancesRow | undefined> {
    return await knex("EquipmentInstances").select().where({ readerID }).first();
}

/**
 * Fetch an EquipmentInstance by its associate reader ID
 * @param id unique id of reader
 * @returns EquipmentInstance or undefined if not exist
 */
export async function getInstanceByAccessControllerID(accessControllerID: number): Promise<EquipmentInstancesRow | undefined> {
    return await knex("EquipmentInstances").where("accessControllerID", "=", accessControllerID).first();
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
 * Assign a reader to a machine instance
 * @param instanceID the ID of the instance to pair to
 * @param readerId the ID of the reader to pair with
 * @return an updated instance or null if that instance couldnt be found to update
 */
export async function assignReaderToEquipmentInstance(instanceID: number, readerID: number | undefined): Promise<EquipmentInstancesRow | undefined> {
    if (readerID != null) {
        // If trying to pair (rather than unpair) verify that pairing is valid
        const reader = await getReaderByID(readerID);
        if (reader == null) {
            throw Error("Could not find reader to pair with");
        }
        if (reader.SN == null) {
            throw Error("Can not pair with old-style reader. Enter values over serial instead");
        }
    }
    return (await knex("EquipmentInstances").update({ readerID: readerID || null }).where({ id: instanceID }).returning("*"))[0];
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