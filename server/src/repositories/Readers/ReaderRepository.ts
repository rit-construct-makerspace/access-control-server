/**
 * readerRepository.ts
 * DB Operations for Readers (ACS Devices)
 */

import { knex } from "../../db/index.js";
import { ReaderRow, TextFieldRow } from "../../db/tables.js";

/**
 * Fetch a card ready buy it's primary key
 * @param id the primary id of the reader
 */
export async function getReaderByID(
    id: number
): Promise<ReaderRow | undefined> {
    return await knex("Readers").first().where({ id: id });
}

/**
 * Fetch areader by the id of the machine it is associated with
 * @param machineID the machine ID of the machine
 */
export async function getReaderByName(
    name: string
): Promise<ReaderRow | undefined> {
    return await knex("Readers").from("Readers").first().where({ name: name });
}


/**
 * Fetch areader by its Serial number/Shlug ID
 * @param SN the serial number of the reader
 */
export async function getReaderBySN(
    SN: string
): Promise<ReaderRow | undefined> {
    return await knex("Readers").from("Readers").first().where({ SN: SN });
}

/**
 * Fetch areader by the id of the machine it is associated with
 * @param machineID the machine ID of the machine
 */
export async function getReaderByMachineID(
    machineID: number
): Promise<ReaderRow | undefined> {
    return await knex("Readers").from("Readers").first().where({ machineID: machineID });
}

/**
 * Fetch all card readers
 */
export async function getReaders(): Promise<ReaderRow[]> {
    return await knex("Readers").select("*").orderBy("helpRequested", "desc").orderBy("id", "asc"); //Order them to prevent random ordering everytime the client polls, also prioritize help
}

/**
 * Fetch unpaired card readers
 * @return list of readers that are not paired with an instance 
 */
export async function getUnpairedReaders(): Promise<ReaderRow[]> {
    return await knex("Readers").select("Readers.*")
        .leftJoin("EquipmentInstances", "Readers.id", "EquipmentInstances.readerID")
        .whereNotNull("SN").andWhere(function () { this.whereNull("EquipmentInstances.readerID") })
        .orderBy("Readers.name", "desc").orderBy("Readers.id", "asc")
}

/**
 * Get number of idle ACS readers
 * @param machineID the equipment ID to find readers for
 * @returns number of reader rows where status="Idle"
 */
export async function getNumIdleReadersByEquipment(machineID: number): Promise<number> {
    return (await knex("Readers")
        .select("*")
        .leftJoin("EquipmentInstances", "EquipmentInstances.readerID", "Readers.id")
        .where({ equipmentID: machineID })
        .andWhere({ state: "Idle" })
        .andWhereRaw(`"lastStatusTime" > now() - interval '5 min'`)).length;
}

/**
 * Get number of active ACS readers
 * @param machineID the equipment ID to find readers for
 * @returns number of reader rows where status != "Idle"
 */
export async function getNumUnavailableReadersByEquipment(machineID: number): Promise<number> {
    return (await knex("Readers")
        .select("*")
        .leftJoin("EquipmentInstances", "EquipmentInstances.readerID", "Readers.id")
        .where({ equipmentID: machineID })
        .andWhere(q =>
            q.where("state", "!=", "Idle")
                .orWhereRaw(`"lastStatusTime" < now() - interval '5 min'`)
        )).length;
}

/**
 * Create a card reader using the non-status attributes
 * @param reader the static attributes of the card reader
 */
export async function createReader(reader: {
    machineID?: number,
    machineType?: string,
    name?: string,
    zone?: string
}): Promise<ReaderRow | undefined> {
    const [newID] = await knex("Readers").insert(reader, "id");
    return await getReaderByID(newID.id);
}



/**
 * Create a card reader from a SN (on first pair) 
 *  @param reader the static attribute of the card reader
 */
export async function createReaderFromSN(reader: {
    SN: string, name: string
}): Promise<ReaderRow | undefined> {
    const [newID] = await knex("Readers").insert(reader, "id");
    return await getReaderByID(newID.id);
}

/**
 * Modify a reader row
 * @param reader the reader attributes
 */
export async function updateReaderStatus(reader: {
    id: number,
    machineID: number | undefined,
    machineType: string | undefined,
    zone: string,
    temp: number,
    state: string,
    currentUID: string,
    recentSessionLength: number,
    lastStatusReason: string,
    scheduledStatusFreq: number,
    helpRequested: boolean,
    BEVer?: string,
    FEVer?: string,
    HWVer?: string,
    sessionStartTime?: Date,
    SN?: string,
    readerKeyCycle?: number,
    pairTime?: Date,
}): Promise<ReaderRow | undefined> {
    await knex("Readers").where({ id: reader.id }).update({
        machineID: reader.machineID,
        machineType: reader.machineType,
        zone: reader.zone,
        temp: reader.temp,
        state: reader.state,
        currentUID: reader.currentUID,
        recentSessionLength: reader.recentSessionLength,
        lastStatusReason: reader.lastStatusReason,
        scheduledStatusFreq: reader.scheduledStatusFreq,
        lastStatusTime: knex.fn.now(),
        helpRequested: reader.helpRequested,
        BEVer: reader.BEVer,
        FEVer: reader.FEVer,
        HWVer: reader.HWVer,
        sessionStartTime: reader.sessionStartTime,
        SN: reader.SN,
        readerKeyCycle: reader.readerKeyCycle,
        pairTime: reader.pairTime,
    })

    return getReaderByID(reader.id);
}

/**
 * Change the name of a reader at id
 * @param id the id of the reader to modify
 * @param name the updated name of the reader
 */
export async function setReaderName(
    id: number, 
    name: string
): Promise<ReaderRow | undefined> {
    await knex("Readers").where({ id: id }).update({ name });
    return await getReaderByID(id);
}

/**
 * Toggle the "helpRequested" column of a noted Reader
 * @param id ID of Reader to modify
 * @returns void
 */
export async function toggleHelpRequested(id: number): Promise<void> {
    const oldRow = await knex("Readers").select("*").where({ id: id }).first()
    return await knex("Readers").where({ id: id }).update({ helpRequested: !(oldRow?.helpRequested)})
}

/**
 * Submit a structured reader log to the db
 * @param readerID the ID of the reader that this message came from
 * @param log the json object data to insert
 * @returns the primary key in the database
 */
export async function submitReaderLog(readerID: number | null, dateTime: Date, log: any): Promise<number> {
    return await knex("ReaderLogs").insert({ readerID, dateTime, log }).returning("id");
}

const ReaderCertCAId = 34;
export async function getReaderCertCA(): Promise<TextFieldRow | undefined> {
    return await knex("TextFields").select().where({ id: ReaderCertCAId }).first();
}
export async function setReaderCertCA(value: string): Promise<number> {
    return await knex("TextFields").update({ value }).where({ id: ReaderCertCAId });
}