import { DeviceLogRow, DeviceLogSeverity } from "../../knex/tables.js";
import { knex } from "../../knex/index.js";

export async function createDeviceLog(deviceID: number | undefined, severity: DeviceLogSeverity, log: object): Promise<DeviceLogRow> {
  if (severity === DeviceLogSeverity.HIGH) {
    console.error(`HIGH severity log for device ${deviceID}: ${JSON.stringify(log, undefined, 2)}`);
  }
  const result = await knex("DeviceLogs").insert({ deviceID: deviceID, severity: severity, log: log }).returning("*");
  return result[0];
}

export async function getRecentDeviceLogs(limit: number = 100): Promise<DeviceLogRow[]> {
  return await knex("DeviceLogs").orderBy("dateTime", "desc").limit(limit);
}