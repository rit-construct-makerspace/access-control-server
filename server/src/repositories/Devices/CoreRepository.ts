import { knex } from "../../db/index.js";
import { CoreRow } from "../../db/tables.js";
import { Core } from "../../models/devices/core.js";

export async function getCoreByDeviceID(deviceID: number): Promise<Core | undefined> {
  const rawRow = await knex("Cores").where("deviceID", deviceID).first();
  return rawRow ? await Core.buid(rawRow) : undefined;
}

export async function updateStatus(coreRow: CoreRow) {

}