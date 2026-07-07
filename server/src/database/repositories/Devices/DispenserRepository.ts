import { knex } from "../../knex/index.js";
import { Dispenser } from "../../models/devices/Dispenser.js";
import * as DeviceRepo from "./DeviceRepository.js";

export async function getMakerspaceDispensers(makerspaceID: number): Promise<Dispenser[]> {
  const rawDispensers = await knex("Dispensers").join("Devices", "Devices.id", "Dispensers.deviceID")
    .where({ makerspaceID: makerspaceID }).select("Dispensers.*").orderBy("Devices.name", "desc");
  return await Promise.all(rawDispensers.map(async (raw) => (await Dispenser.buid(raw))));
}

export async function pairNewDispenser(SN: string, makerspaceID: number): Promise<Dispenser> {
  const newDevice = await DeviceRepo.pairNewDevice(SN, makerspaceID);
  const newDispenser = await knex("Dispensers").insert({
    deviceID: newDevice.id
  }).returning("*");

  return await Dispenser.buid(newDispenser[0]);
}