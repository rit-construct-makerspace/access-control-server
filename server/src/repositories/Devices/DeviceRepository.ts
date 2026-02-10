import { knex } from "../../db/index.js";
import { DeviceRow } from "../../db/tables.js";

/**
 * Get the DeviceRow for the device with the given ID
 * @param id the ID of the device to get
 * @returns the DeviceRow for the device or undefined if no device was found
 */
export async function getDeviceByID(id: number): Promise<DeviceRow | undefined> {
  return await knex("Devices").where("id", "=", id).first();
}

/**
 * Get the DeviceRow for the device with the given name
 * @param name the name of the device to get
 * @returns the DeviceRow for the device or undefined if no device was found
 */
export async function getDeviceByName(name: string): Promise<DeviceRow | undefined> {
  return await knex("Devices").where("name", "=", name).first();
}

/**
 * Get the DeviceRow for the device with the given name
 * @param SN the serial number of the device to get
 * @returns the DeviceRow for the device or undefined if no device was found
 */
export async function getDeviceBySN(SN: string): Promise<DeviceRow | undefined> {
  return await knex("Devices").where("SN", "=", SN).first()
}