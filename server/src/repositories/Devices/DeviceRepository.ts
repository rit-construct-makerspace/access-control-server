import { GraphQLError } from "graphql";
import { knex } from "../../db/index.js";
import { DeviceRow, MakerspaceRow } from "../../db/tables.js";
import { Device } from "../../models/devices/device.js";
import { generateRandomHumanName } from "../../data/humanReadableNames.js";
import { randomInt } from "crypto";

/**
 * Get the DeviceRow for the device with the given ID
 * @param id the ID of the device to get
 * @returns the DeviceRow for the device or undefined if no device was found
 */
export async function getDeviceByID(id: number): Promise<Device | undefined> {
  const rawRow = await knex("Devices").where("id", "=", id).first();
  return rawRow ? new Device(rawRow) : undefined
}

/**
 * Get the DeviceRow for the device with the given name
 * @param name the name of the device to get
 * @returns the DeviceRow for the device or undefined if no device was found
 */
export async function getDeviceByName(name: string): Promise<Device | undefined> {
  const rawRow = await knex("Devices").where("name", "=", name).first();
  return rawRow ? new Device(rawRow) : undefined
}

/**
 * Get the DeviceRow for the device with the given name
 * @param SN the serial number of the device to get
 * @returns the DeviceRow for the device or undefined if no device was found
 */
export async function getDeviceBySN(SN: string): Promise<Device | undefined> {
  const rawRow = await knex("Devices").where("SN", "=", SN).first()
  return rawRow ? new Device(rawRow) : undefined
}

export async function getMakerspaceOfWelcomeDevice(id: number): Promise<MakerspaceRow | undefined> {
  return await knex("MakerspaceWelcomeReaders").join("Makerspaces", "Makerspaces.id", "MakerspaceWelcomeReaders.makerspaceID").select("Makerspaces.*")
    .where("MakerspaceWelcomeReaders.deviceID", "=", id).first();
}

export async function updateDevie(deviceRow: DeviceRow): Promise<Device | undefined> {
  const rawResult = await knex("Devices").where({ id: deviceRow.id }).update(deviceRow).returning("*");
  if (rawResult.length < 1) {
    return undefined;
  } else if (rawResult.length > 1) {
    throw new GraphQLError("Updated the status of two devices simoultaneously");
  }

  return new Device(rawResult[0]);
}

export async function getMakerspaceDevices(makerspaceID: number): Promise<Device[]> {
  const rawDevices = await knex("Devices").where({ makerspaceID: makerspaceID }).orderBy("name", "desc");
  return rawDevices.map((raw) => (new Device(raw)));
}

export async function getMakerspaceGenericDevices(makerspaceID: number): Promise<Device[]> {
  const rawDevices = await knex("Devices").where({ makerspaceID: makerspaceID })
    .whereNotExists(knex("Cores").where("Cores.deviceID", "=", knex.ref("Devices.id"))).orderBy("name", "desc");
  return rawDevices.map((raw) => new Device(raw));
}

async function generateUniqueHumanName() {
  const RANDOM_TRIES = 10;
  for (var i = 0; i < RANDOM_TRIES; i++) {
    const name = generateRandomHumanName();
    if ((await getDeviceByName(name)) == null) {
      return name;
    }
  }
  return `${generateRandomHumanName()}-${randomInt(1000)}`
}

export async function pairNewDevice(SN: string, makerspaceID: number): Promise<Device> {
  const newName = await generateUniqueHumanName();

  const newDevice = await knex("Devices").insert({ SN: SN, name: newName, makerspaceID: makerspaceID }).returning("*");

  return new Device(newDevice[0]);
}