/**
 * readerRepository.ts
 * DB Operations for Readers (ACS Devices)
 */

import { knex } from "../../db/index.js";
import { ReaderLogRow, ReaderRow, TextFieldRow, ZoneRow } from "../../db/tables.js";
import { getInstanceByReaderID } from "../Equipment/EquipmentInstancesRepository.js";
import { getZoneByID } from "../Zones/ZonesRespository.js";

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
 * @param name name of the reader (adjective-color-shlug)
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
 * Fetch all card readers
 */
export async function getReaders(): Promise<ReaderRow[]> {
    //Order them to prevent random ordering everytime the client polls, also prioritize help
    return await knex("Readers")
        .select("*", knex.raw("case when state = 'Fault' then 0 else 1 end as \"faultOrder\""))
        .orderBy("faultOrder", "asc")
        .orderBy("id", "asc")
        ; 
}

export interface ReaderRowWithPairings extends ReaderRow{
    makerspaceID?: number;
    makerspaceName: string

    equipmentID?: number;
    equipmentName?: string;
    equipmentArchived?: boolean;
    instanceID?: number;
    instanceName?: number;
}

/**
 * Fetch all card Readers with pairings
 */
export async function getReadersWithPairings(): Promise<ReaderRowWithPairings[]>{
 
    const res = await knex("Readers as r")
    .select('r.*', 
        knex.raw('z.id as "makerspaceID"'), 
        knex.raw('z.name as "makerspaceName"'), 
        knex.raw('e.id as "equipmentID"'),
        knex.raw('e.name as "equipmentName"'),
        knex.raw('e.archived as "equipmentArchived"'),
        knex.raw('ei.id as "instanceID"'),
        knex.raw('ei.name as "instanceName"'),
        knex.raw("case when state = 'Fault' then 0 else 1 end as \"faultOrder\""))
    .leftOuterJoin("MakerspaceWelcomeReaders as mwr", "mwr.readerID", "r.id")
    .leftJoin("Zones as z", "z.id", "mwr.makerspaceID")
    .leftOuterJoin("EquipmentInstances as ei", "ei.readerID", "r.id")
    .leftJoin("Equipment as e", "ei.equipmentID", "e.id")
    .orderBy("faultOrder", "asc")
    .orderBy("id", "asc") as ReaderRowWithPairings[]; 
        console.log(res);
    return res;
}

/**
 * Fetch unpaired card readers
 * @return list of readers that are not already in use as an instance reader or a welcom reader 
 */
export async function getUnpairedReaders(): Promise<ReaderRow[]> {
    return await knex("Readers").select("Readers.*", "z.id", "z.name")
        .leftJoin("EquipmentInstances", "Readers.id", "EquipmentInstances.readerID")
        .leftJoin("MakerspaceWelcomeReaders as mwr", "Readers.id", "mwr.readerID")
        .whereNotNull("SN").andWhere(function () { this.whereNull("EquipmentInstances.readerID") })
        .andWhere(function () { this.whereNull("mwr.readerID") })
        .orderBy("Readers.name", "desc").orderBy("Readers.id", "asc");
}

export enum PairStatus {
    Unpaired,
    PairedAsInstance,
    PairedAsWelcomer
}
/**
 * Get how a reader is paired
 * @param readerID the reader to check
 * @returns PairedAsInstance if associated with machine instance
 * @returns PairedAsWelcomer if paired as welcome reader for a makerspace
 * @returns Unpaired if neither
 */
export async function getReaderPairStatus(readerID: number): Promise<PairStatus> {
    const instances = await knex("EquipmentInstances").select("*").where("readerID", "=", readerID);
    if (instances.length > 0) {
        return PairStatus.PairedAsInstance;
    }
    const makerspaces = await knex("MakerspaceWelcomeReaders").where("readerID", "=", readerID);
    if (makerspaces.length > 0) {
        return PairStatus.PairedAsWelcomer;
    }
    return PairStatus.Unpaired;
}

/**
 * Pair reader as a welcome reader for a makerspace
 * @param readerID the reader to pair
 * @param makerspaceID the makerspace to pair with
 * @returns true if paired. or throws if either are not found
 */
export async function pairReaderAsMakerspaceWelcomer(readerID: number, makerspaceID: number): Promise<Boolean> {
    try {
        await knex("MakerspaceWelcomeReaders").insert({ makerspaceID: makerspaceID, readerID: readerID });
        return true; // or throw if not found
    } catch {
    }
 
    return false;
}

/**
 * unpair reader as a welcome reader from a makerspace
 * @param readerID the reader to unpair
 * @param makerspaceID the makerspace to unpair from
 * @returns true if paired. or throws if either are not found
 */
export async function unpairReaderAsMakerspaceWelcomer(readerID: number, makerspaceID: number) {
    await knex("MakerspaceWelcomeReaders").delete().where({ readerID: readerID, makerspaceID: makerspaceID });
}

export async function getReaderLogs(searchParams: { makerspaceID?: number, from: Date, to: Date, pageOffset?: number, pageLimit: number }): Promise<ReaderLogRow[]> {
    let query = knex("ReaderLogs as rl");
    console.log("Makerspace filter", searchParams.makerspaceID);
    if (searchParams.makerspaceID) {
        query = query.leftJoin("EquipmentInstances as ei", "rl.readerID", "ei.readerID")
            .leftJoin("Equipment as e", "ei.equipmentID", "e.id")
            .leftJoin("Rooms as rs", "e.roomID", "rs.id")
            .where("rs.zoneID", "=", Number(searchParams.makerspaceID));
    }
    if (searchParams.from) {
        query.andWhere("dateTime", ">", searchParams.from);
    }
    if (searchParams.to) {
        query.andWhere("dateTime", "<", searchParams.to);
    }


    if (searchParams.pageOffset && searchParams.pageLimit) {
        query = query.offset(searchParams.pageOffset).limit(searchParams.pageLimit)
    }

    query = query.select("rl.id", "rl.readerID", "rl.currentInstanceID", "rl.dateTime", "rl.log");
    return query;
}

/**
 * Get number of idle ACS readers
 * @param equipmentID the equipment ID to find readers for
 * @returns number of reader rows where status="Idle"
 */
export async function getNumIdleReadersByEquipment(equipmentID: number): Promise<number> {
    return (await knex("Readers")
        .select("*")
        .leftJoin("EquipmentInstances", "EquipmentInstances.readerID", "Readers.id")
        .where({ equipmentID: equipmentID })
        .andWhere({ state: "Idle" })
        .andWhereRaw(`"lastStatusTime" > now() - interval '5 min'`)).length;
}

/**
 * Get number of active ACS readers
 * @param equipmentID the equipment ID to find readers for
 * @returns number of reader rows where status != "Idle"
 */
export async function getNumUnavailableReadersByEquipment(equipmentID: number): Promise<number> {
    return (await knex("Readers")
        .select("*")
        .leftJoin("EquipmentInstances", "EquipmentInstances.readerID", "Readers.id")
        .where({ equipmentID: equipmentID })
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
    name?: string,
}): Promise<ReaderRow | undefined> {
    const [newID] = await knex("Readers").insert(reader, "id");
    return await getReaderByID(newID.id);
}

export async function deleteReader(id: number): Promise<boolean> {
    return (await knex("Readers").delete().where("id", "=", id)) > 0;
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
    temp: number,
    state: string,
    currentUID: string,
    recentSessionLength: number,
    lastStatusReason: string,
    scheduledStatusFreq: number,
    BEVer?: string,
    FEVer?: string,
    HWVer?: string,
    sessionStartTime?: Date,
    SN?: string,
    readerKeyCycle?: number,
    pairTime?: Date,
}): Promise<ReaderRow | undefined> {
    await knex("Readers").where({ id: reader.id }).update({
        temp: reader.temp,
        state: reader.state,
        currentUID: reader.currentUID,
        recentSessionLength: reader.recentSessionLength,
        lastStatusReason: reader.lastStatusReason,
        scheduledStatusFreq: reader.scheduledStatusFreq,
        lastStatusTime: knex.fn.now(),
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
 * Submit a structured reader log to the db
 * @param readerID the ID of the reader that this message came from
 * @param log the json object data to insert
 * @returns the primary key in the database
 */
export async function submitReaderLog(readerID: number | null, dateTime: Date, log: any): Promise<number> {
    let instance = null;
    if (readerID) {
        instance = await getInstanceByReaderID(readerID);
    }
    return submitReaderLogWithInstance(readerID, instance?.id ?? null, dateTime, log);
}
export async function submitReaderLogWithInstance(readerID: number | null, currentInstanceID: number | null, dateTime: Date, log: any): Promise<number> {
    return await knex("ReaderLogs").insert({ readerID, currentInstanceID, dateTime, log }).returning("id");
}

/**
 * Return the makerspace that this reader is welcoming or null if there is no such makerspace
 * @param readerID the reader to query the makerspace on
 * @returns the id of the makerspace that this reader is linked with
 */
export async function getMakerspaceOfWelcomeReader(readerID: number): Promise<ZoneRow | undefined> {
    const res = (await knex("Readers as r").leftJoin("MakerspaceWelcomeReaders as mwr", "r.id", 'mwr.readerID').where({ readerID: readerID }).select("mwr.makerspaceID").first())

    if (res == null) {
        return undefined;
    }
    return getZoneByID(res.makerspaceID);
}

/**
 * Get active welcome readers for a space
 * @param makerspaceId the makerspace to check
 * @returns a list of readers that are acting as welcome readers for the space
 */
export async function getWelcomeReadersForMakerspace(makerspaceId: number): Promise<ReaderRow[]>{
    return await knex("MakerspaceWelcomeReaders").where({makerspaceID: makerspaceId}).leftJoin("Readers", "Readers.id", "MakerspaceWelcomeReaders.readerID").select("Readers.*");
}

/**
 * Set the target firmware version for some readers
 * @param ids the list of readers to set for
 * @param version the firmware tag to set
 */
export async function setOTAVersions(ids: number[], version: string){
    await knex("Readers").update("targetFirmwareVersion", version).whereIn("id", ids)
}

const ReaderCertCAId = 34;
export async function getReaderCertCA(): Promise<TextFieldRow | undefined> {
    return await knex("TextFields").select().where({ id: ReaderCertCAId }).first();
}
export async function setReaderCertCA(value: string): Promise<number> {
    return await knex("TextFields").update({ value }).where({ id: ReaderCertCAId });
}
