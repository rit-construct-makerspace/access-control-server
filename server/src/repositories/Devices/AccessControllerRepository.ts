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
  await knex("AccessControllers").update({ state: newState }).where({ deviceID: deviceID, channelID: channelID });
}

export async function updateAccessControllerDurationByDeviceAndChannelID(deviceID: number, channelID: number, tempDuration: number): Promise<void> {
  await knex("AccessControllers").update({ tempDuration: tempDuration }).where({ deviceID: deviceID, channelID: channelID });
}