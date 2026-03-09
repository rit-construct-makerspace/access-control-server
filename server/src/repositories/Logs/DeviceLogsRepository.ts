import { DeviceLogRow, DeviceLogSeverity } from "../../db/tables.js";
import { knex } from "../../db/index.js";

export async function createDeviceLog(deviceID: number, severity: DeviceLogSeverity, log: object): Promise<DeviceLogRow> {
  if (severity === DeviceLogSeverity.HIGH) {
    console.error(`HIGH severity log for device ${deviceID}: ${JSON.stringify(log, undefined, 2)}`);
  }
  const result = await knex("DeviceLogs").insert({ deviceID: deviceID, severity: severity, log: log }).returning("*");
  return result[0];
}

export async function getRecentDeviceLogs(): Promise<DeviceLogRow[]> {
  return await knex("DeviceLogs").orderBy("dateTime", "desc").limit(100);
}