import { GraphQLError } from "graphql";
import { knex } from "../../db/index.js";
import { AccessControllerRow, AccessControllerState } from "../../db/tables.js";
import { AccessController } from "../../models/devices/accessController.js";

export async function getAccessControllersByDeviceID(deviceID: number): Promise<AccessController[]> {
  const rawRows = await knex("AccessControllers").where("deviceID", "=", deviceID);
  const coolRows: AccessController[] = [];
  for (let i = 0; i < rawRows.length; i++) {
    coolRows.push(new AccessController(rawRows[i]));
  }
  return coolRows;
}

export async function getAccessControllersByDeviceAndChannelID(deviceID: number, channelID: number): Promise<AccessController | undefined> {
  const rawRow = await knex("AccessControllers").where({ deviceID: deviceID, channelID: channelID }).first();
  return rawRow ? new AccessController(rawRow) : undefined;
}

export async function updateAccessController(newRow: AccessControllerRow): Promise<AccessController | undefined> {
  const rawResult = await knex("AccessControllers").where("id", newRow.id).update(newRow).returning("*");
  if (rawResult.length < 1) {
    return undefined;
  } else if (rawResult.length > 1) {
    throw new GraphQLError("Updates the status of two cores simoultaneously");
  }

  return new AccessController(rawResult[0]);
}

export async function getAccessControllerByID(accessControllerID: number): Promise<AccessController | undefined> {
  const result = await knex("AccessControllers").where({ id: accessControllerID }).first();
  if (result === undefined) { return undefined; }
  return new AccessController(result);
}

export async function updateAccessControllerStateByDeviceAndChannelID(deviceID: number, channelID: number, newState: AccessControllerState): Promise<void> {
  try {
    await knex("AccessControllers").update({ state: newState }).where({ deviceID: deviceID, channelID: channelID });
  } catch (e) {
    console.log(`Update Controller state failed: ${e}`)
  }
}

export async function updateAccessControllerDurationByDeviceAndChannelID(deviceID: number, channelID: number, tempDuration: number): Promise<void> {
  await knex("AccessControllers").update({ tempDuration: tempDuration }).where({ deviceID: deviceID, channelID: channelID });
}

export async function getUnpairedAccessControllers(makerspaceID: number): Promise<AccessController[]> {
  const result = await knex("AccessControllers").select("*").join("Devices", "AccessControllers.deviceID", "Devices.id")
    // Not assigned to an instance
    .whereNotExists(knex("EquipmentInstances").where("EquipmentInstances.controllerID", "=", knex.ref("AccessControllers.id")))
    // Filter to devices in the target makerspace
    .andWhere("Devices.makerspaceID", "=", makerspaceID);

  return result.map((raw) => new AccessController(raw));
}

export async function deleteAllCoreChannels(deviceID: number): Promise<number> {
  const result = await knex("AccessControllers").where({ deviceID: deviceID }).delete();
  return result;
}

export async function createAccessControllers(deviceID: number, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await knex("AccessControllers").insert({ deviceID: deviceID, channelID: i })
  }
}