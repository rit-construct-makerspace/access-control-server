import { AccessControllerState, CoreInputMode, CoreRow, DeviceRow } from "../../db/tables.js";
import { Device } from "./device.js";
import * as DeviceRepo from "../../repositories/Devices/DeviceRepository.js";
import { EntityNotFound } from "../../EntityNotFound.js";
import * as ShlugControl from "../../wsapi.js"
import { CurrentUser } from "../../context.js";
import WSACSController from "../api/WSACS/WSACSController.js";
import { AccessController } from "./accessController.js";
import * as ACRepo from "../../repositories/Devices/AccessControllerRepository.js";
import { CoreConfig, CoreFlags, WSACSServerUnprompted } from "../api/WSACS/WSACSFormats.js";
import * as CoreRepo from "../../repositories/Devices/CoreRepository.js";
import { Makerspace } from "../makerspaces/makerspace.js";
import { ACSDeployment } from "../ACS/deployment.js";
import { ACSOrchestrator } from "../api/ACSOrchestrator.js";

export class Core extends Device implements CoreRow {
  deviceID: number;
  channels: number;
  inputMode: CoreInputMode;
  tempDuration: number;
  currentCardTag: string | undefined;
  lastStatusTime: Date | undefined;
  sessionStartTime: Date | undefined;
  flags: CoreFlags;
  sealedDeployment: ACSDeployment | undefined;
  reportedDeployment: ACSDeployment | undefined;

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

  /**
   * Sends a message to the core to command its state
   * @param executingUser The user setting the state of the core
   * @param targetState The state the core is being set to
   */
  async setState(executingUser: CurrentUser, targetState: AccessControllerState) {
    const controllers = await this.getAccessControllers();
    ACSOrchestrator.handleSendCoreCommand(this.deviceID, {
      toState: controllers.map((controller) => ({ id: controller.channelID, state: targetState }))
    })
    return true;
  }

  async setFlags(executingUser: CurrentUser, targetFlags: CoreFlags) {
    const request: WSACSServerUnprompted = {
      command: {
        flags: targetFlags
      }
    }

    WSACSController.sendCoreRequest(request, this.deviceID);
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

    if (config.channels !== undefined) {
      for (let i = 0; i < config.channels.length; i++) {
        await ACRepo.updateAccessControllerDurationByDeviceAndChannelID(this.deviceID, config.channels[i].channelID, config.channels[i].tempDuration);
      }
    }

    if (config.inputMode !== undefined) {
      await CoreRepo.updateCoreInputMode(this.deviceID, config.inputMode);
    }

    if (config.deployment !== undefined) {
      await CoreRepo.updateCoreDeployment(this.deviceID, config.deployment);
    }

    if (config.flags !== undefined) {
      await CoreRepo.setCoreFlags(this.deviceID, config.flags);
    }

    if (config.firmware !== undefined) {
      await this.updateFirmwareVersion(config.firmware);
    }
  }

  async authTo(userID: number, toState: AccessControllerState, log?: boolean): Promise<{
    channelID: number;
    state: AccessControllerState;
    approved: boolean;
    reason: string;
  }[]> {
    const result: {
      channelID: number;
      state: AccessControllerState;
      approved: boolean;
      reason: string;
    }[] = [];

    const controllers = await this.getAccessControllers();

    for (let i = 0; i < controllers.length; i++) {
      let controller = controllers[i];
      if (toState === AccessControllerState.UNLOCKED) {
        const attempt = await controller.canUnlock(userID, log);
        result.push({ channelID: controller.channelID, state: toState, approved: attempt.hasAccess, reason: attempt.reason });
      } else {
        const attempt = await controller.canControl(userID);
        result.push({ channelID: controller.channelID, state: toState, approved: attempt.canControl, reason: attempt.reason });
      }
    }

    return result;
  }
}