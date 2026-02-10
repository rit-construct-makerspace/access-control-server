import { knex } from "../../db/index.js";
import { AccessControllerRow } from "../../db/tables.js";
import { AccessController } from "../../models/devices/accessController.js";

export async function getAccessControllersByDeviceID(deviceID: number): Promise<AccessController[]> {
  const rawRows = await knex("AccessControllers").where("deviceID", "=", deviceID);
  const coolRows: AccessController[] = [];
  for (let i = 0; i < rawRows.length; i++) {
    coolRows.push(new AccessController(rawRows[i]));
  }
  return coolRows;
}