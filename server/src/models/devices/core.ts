import { CoreInputMode, CoreRow, DeviceRow } from "../../db/tables.js";
import { Device } from "./device.js";
import * as DeviceRepo from "../../repositories/Devices/DeviceRepository.js";
import { EntityNotFound } from "../../EntityNotFound.js";

export class Core extends Device implements CoreRow {
  deviceID: number;
  channels: number;
  inputMode: CoreInputMode;
  tempDuration: number;
  currentCardtag: string | undefined;
  lastStatusReason: string | undefined;
  lastStatusTime: Date | undefined;
  sessionStartTime: Date | undefined;

  constructor(coreRow: CoreRow, deviceRow: DeviceRow) {
    super(deviceRow);
    this.deviceID = coreRow.deviceID;
    this.channels = coreRow.channels;
    this.inputMode = coreRow.inputMode;
    this.tempDuration = coreRow.tempDuration;
    this.currentCardtag = coreRow.currentCardtag;
    this.lastStatusReason = coreRow.lastStatusReason;
    this.lastStatusTime = coreRow.lastStatusTime;
    this.sessionStartTime = coreRow.sessionStartTime;
  }

  static async buid(coreRow: CoreRow) {
    const deviceRow = await DeviceRepo.getDeviceByID(coreRow.deviceID);
    if (deviceRow === undefined) { throw EntityNotFound; }
    return new Core(coreRow, deviceRow);
  }

}