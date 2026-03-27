import { ACSController } from "./ACSController.js";
import { CoreAuthToRequest, CoreConfigReport, CoreInfoRequest, CoreLogRequest, CoreStateChangeReport, CoreStatusReport } from "./ACSFormats.js";
import * as CoreRepo from "../../repositories/Devices/CoreRepository.js";
import * as ACRepo from "../../repositories/Devices/AccessControllerRepository.js";
import { AccessControllerState } from "../../db/tables.js";

export class ACSOrchestrator {
  private static coreControllers: Map<number, ACSController> = new Map();

  public static registerDevice(deviceID: number, controller: ACSController) {
    ACSOrchestrator.coreControllers.set(deviceID, controller);
  }

  public static getDeviceController(deviceID: number): ACSController | undefined {
    return ACSOrchestrator.coreControllers.get(deviceID);
  }

  public static async handleCoreStatusReport(deviceID: number, statusReport: CoreStatusReport) {

    const core = await CoreRepo.getCoreByDeviceID(deviceID);
    if (core === undefined) { return; }

    await core.statusUpdate(statusReport.currentCardTag);
    statusReport.channels.forEach(async (channel) => await core.updateControllerState(channel.channelID, channel.state));
  }

  public static async handleCoreStateChangeReport(deviceID: number, stateChangeReport: CoreStateChangeReport) {
    const core = await CoreRepo.getCoreByDeviceID(deviceID);
    if (core === undefined) { return; }

    const oldCardTag = core.currentCardTag;

    await core.statusUpdate(stateChangeReport.currentCardTag);

    stateChangeReport.channels.forEach(async (channel) => {
      if (channel.fromState === AccessControllerState.UNLOCKED) {
        // Leaving UNLOCKED, register an end of session message
        (await ACRepo.getAccessControllersByDeviceAndChannelID(deviceID, channel.channelID))?.endSession(oldCardTag ?? "");
      } else if (channel.toState === AccessControllerState.UNLOCKED) {
        // TODO: Register start of session
      }
      await core.updateControllerState(channel.channelID, channel.toState);
    })
  }

  public static async handleCoreLogRequest(deviceID: number, logRequest: CoreLogRequest) {

  }

  public static async handleCoreAuthToRequest(deviceID: number, authToRequest: CoreAuthToRequest) {

  }

  public static async handleCoreConfigReport(deviceID: number, configReport: CoreConfigReport) {

  }

  public static async handleCoreInfoRequest(deviceID: number, infoRequest: CoreInfoRequest) {

  }
}