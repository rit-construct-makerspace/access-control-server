import { GraphQLError } from "graphql";
import { knex } from "../../db/index.js";
import { AccessControllerState, CoreInputMode, CoreRow } from "../../db/tables.js";
import { Core } from "../../models/devices/core.js";
import * as ACRepo from "./AccessControllerRepository.js";
import * as DeviceRepo from "./DeviceRepository.js";

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

export async function getMakerspaceCores(makerspaceID: number): Promise<Core[]> {
  const rawCores = await knex("Cores").join("Devices", "Devices.id", "Cores.deviceID")
    .where({ makerspaceID: makerspaceID }).select("Cores.*").orderBy("Devices.name", "desc");
  return await Promise.all(rawCores.map(async (raw) => (await Core.buid(raw))));
}

export async function getCoreState(deviceID: number): Promise<AccessControllerState> {
  const stateRankings = [AccessControllerState.IDLE, AccessControllerState.LOCKED_OUT, AccessControllerState.UNLOCKED, AccessControllerState.ALWAYS_ON, AccessControllerState.FAULT];

  const controllers = await ACRepo.getAccessControllersByDeviceID(deviceID);
  let highState = stateRankings[0];

  for (let i = 0; i < controllers.length; i++) {
    if (stateRankings.indexOf(controllers[i].state) > stateRankings.indexOf(highState)) {
      highState = controllers[i].state;
    }
  }

  return highState;
}

export async function pairNewCore(SN: string, makerspaceID: number): Promise<Core> {
  const newDevice = await DeviceRepo.pairNewDevice(SN, makerspaceID);
  const newCore = await knex("Cores").insert({
    deviceID: newDevice.id,
    channels: 0,
    inputMode: CoreInputMode.INSERT,
    tempDuration: 0
  }).returning("*");

  return await Core.buid(newCore[0]);
}

export async function coreStatusUpdate(deviceID: number, cardTagID: string | undefined) {
  await knex("Cores").update({ currentCardTag: cardTagID, lastStatusTime: knex.fn.now() }).where({ deviceID: deviceID });
}

export async function updateCoreDeployment(deviceID: number, deployment: object): Promise<void> {
  await knex("Cores").update({ reportedDeployment: deployment }).where({ deviceID: deviceID });
}

export async function sealCoreDeployment(deviceID: number): Promise<void> {
  await knex("Cores").update({ sealedDeployment: knex.ref("reportedDeployment") }).where({ deviceID: deviceID });
}

export async function updateCoreInputMode(deviceID: number, mode: CoreInputMode): Promise<void> {
  await knex("Cores").update({ inputMode: mode }).where({ deviceID: deviceID });
}