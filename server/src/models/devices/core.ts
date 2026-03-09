import { AccessControllerState, CoreInputMode, CoreRow, DeviceRow } from "../../db/tables.js";
import { Device } from "./device.js";
import * as DeviceRepo from "../../repositories/Devices/DeviceRepository.js";
import { EntityNotFound } from "../../EntityNotFound.js";
import * as ShlugControl from "../../wsapi.js"
import { CurrentUser } from "../../context.js";
import WSACSController from "../api/WSACSController.js";
import { AccessController } from "./accessController.js";
import * as ACRepo from "../../repositories/Devices/AccessControllerRepository.js";
import { CoreConfig, WSACSServerUnprompted } from "../api/WSACSFormats.js";
import * as CoreRepo from "../../repositories/Devices/CoreRepository.js";
import { Makerspace } from "../makerspaces/makerspace.js";

export class Core extends Device implements CoreRow {
  deviceID: number;
  channels: number;
  inputMode: CoreInputMode;
  tempDuration: number;
  currentCardTag: string | undefined;
  lastStatusTime: Date | undefined;
  sessionStartTime: Date | undefined;
  flags: object;
  sealedDeployment: object | undefined;
  reportedDeployment: object | undefined;

  constructor(coreRow: CoreRow, deviceRow: DeviceRow) {
    super(deviceRow);
    this.deviceID = coreRow.deviceID;
    this.channels = coreRow.channels;
    this.inputMode = coreRow.inputMode;
    this.tempDuration = coreRow.tempDuration;
    this.currentCardTag = coreRow.currentCardTag;
    this.lastStatusTime = coreRow.lastStatusTime;
    this.sessionStartTime = coreRow.sessionStartTime;
    this.flags = coreRow.flags;
    this.sealedDeployment = coreRow.sealedDeployment;
    this.reportedDeployment = coreRow.reportedDeployment;
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
    const request: WSACSServerUnprompted = {
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
    const controllers = await ACRepo.getAccessControllersByDeviceID(this.deviceID);

    return controllers.sort((a, b) => (a.channelID - b.channelID));
  }

  getRow(): CoreRow {
    return {
      deviceID: this.deviceID,
      channels: this.channels,
      inputMode: this.inputMode,
      tempDuration: this.tempDuration,
      currentCardTag: this.currentCardTag,
      lastStatusTime: this.lastStatusTime,
      sessionStartTime: this.sessionStartTime,
      flags: this.flags,
      sealedDeployment: this.sealedDeployment,
      reportedDeployment: this.reportedDeployment
    }
  }

  async statusUpdate(curCardTag: string | undefined): Promise<void> {
    await CoreRepo.coreStatusUpdate(this.deviceID, curCardTag);
  }

  async updateControllerState(channelID: number, newState: AccessControllerState) {
    await ACRepo.updateAccessControllerStateByDeviceAndChannelID(this.deviceID, channelID, newState);
  }

  async getWelcomeMakerspace(): Promise<Makerspace | undefined> {
    const rawRow = await DeviceRepo.getMakerspaceOfWelcomeDevice(this.id);
    return rawRow === undefined ? undefined : new Makerspace(rawRow);
  }


  async updateConfiguration(config: CoreConfig): Promise<void> {

    for (let i = 0; i < config.channels.length; i++) {
      await ACRepo.updateAccessControllerDurationByDeviceAndChannelID(this.deviceID, config.channels[i].id, config.channels[i].tempDuration);
    }

    await CoreRepo.updateCoreInputMode(this.deviceID, config.inputMode);
    await CoreRepo.updateCoreDeployment(this.deviceID, config.deployment);
  }
}