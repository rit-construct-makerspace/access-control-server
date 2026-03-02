import { AccessControllerState, CoreInputMode, CoreRow, DeviceRow } from "../../db/tables.js";
import { Device } from "./device.js";
import * as DeviceRepo from "../../repositories/Devices/DeviceRepository.js";
import { EntityNotFound } from "../../EntityNotFound.js";
import * as ShlugControl from "../../wsapi.js"
import { CurrentUser } from "../../context.js";
import WSACSController from "../api/WSACSController.js";
import { AccessController } from "./accessController.js";
import * as ACRepo from "../../repositories/Devices/AccessControllerRepository.js";
import { WSACSServerRequest } from "../api/WSACSFormats.js";

export class Core extends Device implements CoreRow {
  deviceID: number;
  channels: number;
  inputMode: CoreInputMode;
  tempDuration: number;
  currentCardTag: string | undefined;
  lastStatusTime: Date | undefined;
  sessionStartTime: Date | undefined;

  constructor(coreRow: CoreRow, deviceRow: DeviceRow) {
    super(deviceRow);
    this.deviceID = coreRow.deviceID;
    this.channels = coreRow.channels;
    this.inputMode = coreRow.inputMode;
    this.tempDuration = coreRow.tempDuration;
    this.currentCardTag = coreRow.currentCardTag;
    this.lastStatusTime = coreRow.lastStatusTime;
    this.sessionStartTime = coreRow.sessionStartTime;
  }

  static async buid(coreRow: CoreRow) {
    const deviceRow = await DeviceRepo.getDeviceByID(coreRow.deviceID);
    if (deviceRow === undefined) { throw EntityNotFound; }
    return new Core(coreRow, deviceRow);
  }

  async setState(executingUser: CurrentUser, targetState: AccessControllerState) {
    try {
      await ShlugControl.sendState(executingUser, this.deviceID, targetState)
    } catch (e) {
      console.log(`failed to parse id: ${e}`);
      return false;
    }

    const controllers = await this.getAccessControllers();
    const request: WSACSServerRequest = {
      command: {
        toState: []
      }
    };

    for (let i = 0; i < controllers.length; i++) {
      request.command?.toState?.push({ id: controllers[i].channelID, state: targetState });
    }

    WSACSController.sendCoreRequest(request, this.deviceID);

    return true;
  }

  async getAccessControllers(): Promise<AccessController[]> {
    return await ACRepo.getAccessControllersByDeviceID(this.deviceID);
  }

  getRow(): CoreRow {
    return {
      deviceID: this.deviceID,
      channels: this.channels,
      inputMode: this.inputMode,
      tempDuration: this.tempDuration,
      currentCardTag: this.currentCardTag,
      lastStatusTime: this.lastStatusTime,
      sessionStartTime: this.sessionStartTime
    }
  }

}