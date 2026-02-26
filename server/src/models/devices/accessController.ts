import { AccessControllerRow, AccessControllerState } from "../../db/tables.js";

export class AccessController implements AccessControllerRow {
  id: number;
  deviceID: number;
  channelID: number;
  state: AccessControllerState;

  constructor(rawRow: AccessControllerRow) {
    this.id = rawRow.id;
    this.deviceID = rawRow.deviceID;
    this.channelID = rawRow.channelID;
    this.state = rawRow.state;
  }
}