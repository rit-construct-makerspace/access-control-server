import { ACSController } from "./ACSController.js";
import { CoreAuthToRequest, CoreConfigReport, CoreInfoOptions, CoreInfoRequest, CoreLogRequest, CoreStateChangeReport, CoreStatusReport, ServerInfoResponse } from "./ACSFormats.js";
import * as CoreRepo from "../../repositories/Devices/CoreRepository.js";
import * as ACRepo from "../../repositories/Devices/AccessControllerRepository.js";
import * as AuditLogRepo from "../../repositories/AuditLogs/AuditLogRepository.js";
import * as DeviceLogRepo from "../../repositories/Logs/DeviceLogsRepository.js";
import { AccessControllerState, DeviceLogSeverity } from "../../db/tables.js";

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
    const core = await CoreRepo.getCoreByDeviceID(deviceID);
    if (core === undefined) { return; }

    if (logRequest.auditLog) {
      AuditLogRepo.createAuditLog(
        `Message from {device}: ${logRequest.message}`,
        logRequest.category,
        core.makerspaceID,
        { id: core.deviceID, label: core.name }
      )
    } else {
      DeviceLogRepo.createDeviceLog(
        core.deviceID,
        DeviceLogSeverity.LOW,
        { type: "message", message: logRequest.message }
      )
    }
  }

  public static async handleCoreAuthToRequest(deviceID: number, authToRequest: CoreAuthToRequest) {
    const core = await CoreRepo.getCoreByDeviceID(deviceID);
    if (core === undefined) { return; }


  }

  public static async handleCoreConfigReport(deviceID: number, configReport: CoreConfigReport) {

  }

  public static async handleCoreInfoRequest(deviceID: number, infoRequest: CoreInfoRequest) {
    const core = await CoreRepo.getCoreByDeviceID(deviceID);
    if (core === undefined) { return; }

    const response: ServerInfoResponse = {
      time: infoRequest.fields.includes(CoreInfoOptions.TIME)
        ? (new Date).getTime() : undefined,
      state: infoRequest.fields.includes(CoreInfoOptions.STATE)
        ? (await core.getAccessControllers()).map((controller) => ({ id: controller.channelID, state: controller.state })) : undefined,
      hmi: undefined
    }

    ACSOrchestrator.getDeviceController(core.deviceID)?.sendCoreInfoResponse(core, response);
  }
}