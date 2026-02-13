import { DeviceRow } from "../../db/tables.js";

export class Device implements DeviceRow {
  id: number;
  name: string;
  SN: string;
  pairTime: Date;
  hardwareVersion: string | undefined;
  firmwareVersion: string | undefined;
  targetFirmware: string | undefined;
  keyCyle: number;
  makerspaceID: number;

  constructor(row: DeviceRow) {
    this.id = row.id;
    this.name = row.name;
    this.SN = row.SN;
    this.pairTime = row.pairTime;
    this.hardwareVersion = row.hardwareVersion;
    this.firmwareVersion = row.firmwareVersion;
    this.targetFirmware = row.targetFirmware;
    this.keyCyle = row.keyCyle;
    this.makerspaceID = row.makerspaceID;
  }

}