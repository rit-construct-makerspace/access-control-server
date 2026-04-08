import { ACSController } from "./ACSController.js";
import { CoreAuthToRequest, CoreConfigReport, CoreInfoOptions, CoreInfoRequest, CoreLogRequest, CoreStateChangeReport, CoreStatusReport, ServerCommand, ServerInfoResponse } from "./ACSFormats.js";
import * as CoreRepo from "../../repositories/Devices/CoreRepository.js";
import * as ACRepo from "../../repositories/Devices/AccessControllerRepository.js";
import * as AuditLogRepo from "../../repositories/AuditLogs/AuditLogRepository.js";
import * as DeviceLogRepo from "../../repositories/Logs/DeviceLogsRepository.js";
import * as UserRepo from "../../repositories/Users/UserRepository.js";
import * as MakerspaceRepo from "../../repositories/Makerspaces/MakerspaceRespository.js";
import * as DeviceRepo from "../../repositories/Devices/DeviceRepository.js";
import { AccessControllerState, DeviceLogSeverity } from "../../db/tables.js";
import { AccessAttemptReason } from "../devices/accessController.js";
import { Makerspace } from "../makerspaces/makerspace.js";

export class ACSOrchestrator {
  private static coreControllers: Map<number, ACSController> = new Map();

  public static registerDevice(deviceID: number, controller: ACSController) {
    ACSOrchestrator.coreControllers.set(deviceID, controller);
  }

  public static getDeviceController(deviceID: number): ACSController | undefined {
    return ACSOrchestrator.coreControllers.get(deviceID);
  }

  public static async handleCoreStatusReport(deviceID: number, statusReport: CoreStatusReport) {
    try {
      const core = await CoreRepo.getCoreByDeviceID(deviceID);
      if (core === undefined) { return; }

      await core.statusUpdate(statusReport.currentCardTag);

      for (let i = 0; i < statusReport.channels.length; i++) {
        await core.updateControllerState(statusReport.channels[i].channelID, statusReport.channels[i].state);
      }

    } catch (e) {
      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.MEDIUM, { type: "core-status-error", error: e });
    }
  }

  public static async handleCoreStateChangeReport(deviceID: number, stateChangeReport: CoreStateChangeReport) {
    try {
      const core = await CoreRepo.getCoreByDeviceID(deviceID);
      if (core === undefined) { return; }

      const oldCardTag = core.currentCardTag;

      await core.statusUpdate(stateChangeReport.currentCardTag);

      for (let i = 0; i < stateChangeReport.channels.length; i++) {
        const channel = stateChangeReport.channels[i];

        // TODO: put this in an AccessController.reportStateChange function, such that if we detect a state change in a regular status update,
        // we can still trigger the proper effects

        if (channel.fromState === AccessControllerState.UNLOCKED) {
          // Leaving UNLOCKED, register an end of session message
          (await ACRepo.getAccessControllersByDeviceAndChannelID(deviceID, channel.channelID))?.endSession(oldCardTag ?? "");
        } else if (channel.toState === AccessControllerState.UNLOCKED) {
          // Going to UNLOCKED, register start of session message
          (await ACRepo.getAccessControllersByDeviceAndChannelID(deviceID, channel.channelID))?.startSession(stateChangeReport.currentCardTag)
        }
        await core.updateControllerState(channel.channelID, channel.toState);
      }

    } catch (e) {
      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.MEDIUM, { type: "core-state-change-report-error", error: e });
    }
  }

  public static async handleCoreLogRequest(deviceID: number, logRequest: CoreLogRequest) {
    try {
      const core = await CoreRepo.getCoreByDeviceID(deviceID);
      if (core === undefined) { return; }

      if (logRequest.auditLog) {
        await AuditLogRepo.createAuditLog(
          `Message from {device}: ${logRequest.message}`,
          logRequest.category,
          core.makerspaceID,
          { id: core.deviceID, label: core.name }
        )
      } else {
        await DeviceLogRepo.createDeviceLog(
          core.deviceID,
          DeviceLogSeverity.LOW,
          { type: "message", message: logRequest.message }
        )
      }
    } catch (e) {
      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.MEDIUM, { type: "core-log-error", error: e });
    }
  }

  public static async handleCoreAuthToRequest(deviceID: number, authToRequest: CoreAuthToRequest) {
    try {
      const core = await CoreRepo.getCoreByDeviceID(deviceID);
      const user = await UserRepo.getUserByCardTagID(authToRequest.cardTagID);

      if (core === undefined || user === undefined) {
        await AuditLogRepo.createAuditLog(
          `{user} failed to activate {device}`,
          "auth",
          core?.makerspaceID,
          { id: user?.id ?? -1, label: user ? `${user.firstName} ${user.lastName}` : "Unknown User" },
          { id: deviceID, label: core ? core.name : "unkown device" }
        );

        if (core !== undefined) {
          const controllers = await core.getAccessControllers();
          ACSOrchestrator.getDeviceController(deviceID)?.sendCoreAuthToResponse(core, {
            channels: controllers.map((controller) => ({
              channelID: controller.channelID,
              state: authToRequest.state,
              approved: false,
              reason: AccessAttemptReason.UNKNOWN_USER
            })),
            cardTagID: authToRequest.cardTagID
          })
        }
        return;
      }

      const attemptResult = await core.authTo(user.id, authToRequest.state, true);

      ACSOrchestrator.getDeviceController(deviceID)?.sendCoreAuthToResponse(core, {
        channels: attemptResult,
        cardTagID: authToRequest.cardTagID
      })
    } catch (e) {
      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.MEDIUM, { type: "core-authTo-error", error: e });
    }
  }

  public static async handleCoreConfigReport(deviceID: number, configReport: CoreConfigReport) {
    try {
      const core = await CoreRepo.getCoreByDeviceID(deviceID);
      if (core === undefined) { return; }
      await core.updateConfiguration(configReport)
    } catch (e) {
      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.MEDIUM, { type: "core-config-report-error", error: e });
    }
  }

  public static async handleCoreInfoRequest(deviceID: number, infoRequest: CoreInfoRequest) {
    try {
      const core = await CoreRepo.getCoreByDeviceID(deviceID);
      if (core === undefined) { return; }

      const response: ServerInfoResponse = {
        time: infoRequest.fields.includes(CoreInfoOptions.TIME)
          ? (new Date).getTime() : undefined,
        state: infoRequest.fields.includes(CoreInfoOptions.STATE)
          ? (await core.getAccessControllers()).map((controller) => ({ id: controller.channelID, state: controller.state })) : undefined,
        hmi: undefined,
        flags: infoRequest.fields.includes(CoreInfoOptions.FLAGS)
          ? {
            lockWhenIdle: core.flags?.lockWhenIdle ?? false,
            restartWhenUnused: core.flags?.restartWhenUnused ?? false,
            welcoming: (await core.getWelcomeMakerspace()) !== undefined
          } : undefined
      }

      ACSOrchestrator.getDeviceController(core.deviceID)?.sendCoreInfoResponse(core, response);
    } catch (e) {
      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.MEDIUM, { type: "core-info-request-error", error: e });
    }
  }

  public static async handleSendCoreCommand(deviceID: number, command: ServerCommand) {
    try {
      const core = await CoreRepo.getCoreByDeviceID(deviceID);
      if (core === undefined) { return; }

      ACSOrchestrator.getDeviceController(deviceID)?.sendCoreCommand(core, command);
    } catch (e) {
      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.MEDIUM, { type: "send-core-command-error", error: e });
    }
  }

  public static async handleWelcomeRequest(makerspaceID: number, deviceID: number, cardTagID: string) {
    try {
      const device = await DeviceRepo.getDeviceByID(deviceID);
      if (device === undefined) { console.log("can't find device"); return; }

      const rawSpace = await MakerspaceRepo.getMakerspaceByID(makerspaceID);
      if (rawSpace === undefined) { console.log("can't find makerspace"); return; }

      const user = await UserRepo.getUserByCardTagID(cardTagID);
      if (user === undefined) {
        ACSOrchestrator.getDeviceController(deviceID)?.sendWelcomeResponse(device, { welcomed: false, cardTagID: cardTagID });
        await AuditLogRepo.createAuditLog(
          `Unkown card {conceal} failed to sign in to {makerspace}`,
          "welcome",
          rawSpace.id,
          { id: 0, label: cardTagID },
          { id: rawSpace.id, label: rawSpace.name }
        );
        return;
      }

      const welcomeSpace = new Makerspace(rawSpace);

      await welcomeSpace.welcome(user.id);

      ACSOrchestrator.getDeviceController(deviceID)?.sendWelcomeResponse(device, { welcomed: true, cardTagID: cardTagID });

      await AuditLogRepo.createAuditLog(
        `{user} signed in to {makerspace}`,
        "welcome",
        rawSpace.id,
        { id: user.id, label: `${user.firstName} ${user.lastName}` },
        { id: rawSpace.id, label: rawSpace.name }
      );

    } catch (_e) {

    }
  }
}