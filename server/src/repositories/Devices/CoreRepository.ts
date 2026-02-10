import { GraphQLError } from "graphql";
import { knex } from "../../db/index.js";
import { CoreRow } from "../../db/tables.js";
import { Core } from "../../models/devices/core.js";

export async function getCoreByDeviceID(deviceID: number): Promise<Core | undefined> {
  const rawRow = await knex("Cores").where("deviceID", deviceID).first();
  return rawRow ? await Core.buid(rawRow) : undefined;
}

export async function updateCore(coreRow: CoreRow): Promise<Core | undefined> {
  const rawResult = await knex("Cores").where({ deviceID: coreRow.deviceID }).update(coreRow).returning("*");
  if (rawResult.length < 1) {
    return undefined;
  } else if (rawResult.length > 1) {
    throw new GraphQLError("Updates the status of two cores simoultaneously");
  }

  return await Core.buid(rawResult[0]);
}