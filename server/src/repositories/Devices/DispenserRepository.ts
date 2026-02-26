import { knex } from "../../db/index.js";
import { Dispenser } from "../../models/devices/Dispenser.js";

export async function getMakerspaceDispensers(makerspaceID: number): Promise<Dispenser[]> {
  const rawDispensers = await knex("Dispensers").join("Devices", "Devices.id", "Dispensers.deviceID")
    .where({ makerspaceID: makerspaceID }).select("Dispensers.*").orderBy("Devices.name", "desc");
  return await Promise.all(rawDispensers.map(async (raw) => (await Dispenser.buid(raw))));
}