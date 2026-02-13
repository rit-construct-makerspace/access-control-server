import { DeviceRow, DispenserRow } from "../../db/tables.js";
import { Device } from "./device.js";
import * as DeviceRepo from "../../repositories/Devices/DeviceRepository.js";
import { EntityNotFound } from "../../EntityNotFound.js";
import { DispenserError } from "../../api/devices/cards/cardApi.js";

export class Dispenser extends Device implements DispenserRow {
  deviceID: number;
  cardsLeft: number;
  error: DispenserError;

  constructor(dispenserRow: DispenserRow, deviceRow: DeviceRow) {
    super(deviceRow);
    this.deviceID = dispenserRow.deviceID;
    this.cardsLeft = dispenserRow.cardsLeft;
    this.error = dispenserRow.error;
  }

  static async buid(dispenserRow: DispenserRow) {
    const deviceRow = await DeviceRepo.getDeviceByID(dispenserRow.deviceID);
    if (deviceRow === undefined) { throw EntityNotFound; }
    return new Dispenser(dispenserRow, deviceRow);
  }

}