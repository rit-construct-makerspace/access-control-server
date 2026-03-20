import * as ws from "ws";
import { Request } from "express";
import { CoreInfoRequests, WSACSCoreUnprompted, WSACSServerError, WSACSServerUnprompted, WSACSServerPrompted } from "./WSACSFormats.js";
import * as CoreRepo from "../../repositories/Devices/CoreRepository.js";
import * as UserRepo from "../../repositories/Users/UserRepository.js";
import * as AuditLogRepo from "../../repositories/AuditLogs/AuditLogRepository.js";
import { AccessControllerState, DeviceLogSeverity } from "../../db/tables.js";
import { AccessAttemptReason } from "../devices/accessController.js";
import * as DeviceLogRepo from "../../repositories/Logs/DeviceLogsRepository.js";
import * as DeviceRepo from "../../repositories/Devices/DeviceRepository.js";

type ConnectionData = {
  ws: ws.WebSocket;
  deviceID: number;
}

enum WSAPIError {
  Protocol = 4000,
  InvalidMessageFormat = 4001,
  Unauthenticated = 4002,
  BadBootMessage = 4003,
}

export default class WSACSController {
  private static corePool: Map<number, ConnectionData> = new Map();

  private static async handleWsClose(event: ws.CloseEvent, deviceID: number) {
    const connData = WSACSController.corePool.get(deviceID);
    try {
      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.MEDIUM, { type: "ws-close", event: event });
      if (connData) {
        WSACSController.corePool.delete(deviceID);
      }
    } catch (e: any) {
      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.HIGH, { type: "ws-close-error", error: e });
      console.error(`WSACS: Device ${deviceID} Close Exception: ${e}`)
    }
  }

  private static async handleWsError(event: ws.ErrorEvent, deviceID: number) {
    const connData = WSACSController.corePool.get(deviceID);
    try {
      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.HIGH, { type: "ws-error", event: event });
      console.error(`WSACS: Device ${deviceID} websocket error: ${event.error} - ${event.type}: ${event.message}`);
    } catch (e) {
      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.HIGH, { type: "ws-handle-error-error", error: e, event: event });
      console.error(`WSACS: Device ${deviceID} Error Handle Exception: ${e}`);
    }
  }

  private static async handleWsMessage(event: ws.MessageEvent, deviceID: number) {

    if (event.data === undefined || event.data === null || event.data === "null") {
      const response: WSACSServerPrompted = { error: WSACSServerError.BAD_REQUEST };
      WSACSController.sendCoreResponse(response, deviceID);
      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.MEDIUM, { type: "ws-empty-message", event: event });
      return;
    }

    try {
      const request = parseRequest(event.data);
      if (request.authTo !== undefined) {
        WSACSController.sendCoreResponse(await handleCoreAuthToRequest(request, deviceID), deviceID);
      } else if (request.info !== undefined) {
        WSACSController.sendCoreResponse(await handleCoreInfoRequest(request, deviceID), deviceID);
      } else if (request.message !== undefined) {
        // A message request does not require a response from the server
        await handleCoreMessageRequest(request, deviceID);
      } else if (request.status !== undefined) {
        // A status request does not require a response from the server
        await handleCoreStatusRequest(request, deviceID);
      } else {
        await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.HIGH, { type: "ws-message-unknown-type", event: event });
        const response: WSACSServerPrompted = { error: WSACSServerError.BAD_REQUEST };
        WSACSController.sendCoreResponse(response, deviceID);
        return;
      }

      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.LOW, { type: "ws-message", event: event });

    } catch (e) {
      console.error(`WSACS: Device ${deviceID} Message Exception: ${e}`)
      await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.LOW, { type: "ws-message-error", error: e, event: event });
      const response: WSACSServerPrompted = { error: WSACSServerError.SERVER_ERROR };
      WSACSController.sendCoreResponse(response, deviceID);
    }
  }

  static initConnection(ws: ws.WebSocket, req: Request) {
    // @ts-expect-error using our own added field
    const deviceID = req.core?.deviceID;
    if (deviceID === undefined) {
      ws.close(WSAPIError.Protocol);
      DeviceLogRepo.createDeviceLog(undefined, DeviceLogSeverity.MEDIUM, { type: "ws-unknown-device-connect", request: req });
      return;
    }

    const connData = WSACSController.corePool.get(deviceID);

    if (connData !== undefined) {
      connData.ws.close(WSAPIError.Protocol, "Core is attempting to reconnect");
      DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.MEDIUM, { type: "ws-reconnect" });
      WSACSController.corePool.delete(deviceID);
    }

    WSACSController.corePool.set(deviceID, {
      ws: ws,
      deviceID: deviceID
    });

    ws.onclose = (event) => WSACSController.handleWsClose(event, deviceID);
    ws.onerror = (event) => WSACSController.handleWsError(event, deviceID);
    ws.onmessage = (event) => WSACSController.handleWsMessage(event, deviceID);
  }

  static sendCoreRequest(payload: WSACSServerUnprompted, deviceID: number): boolean {
    const connection = WSACSController.corePool.get(deviceID);
    if (connection === undefined) { return false; }
    connection.ws.send(JSON.stringify(payload));
    return true;
  }

  static sendCoreResponse(payload: WSACSServerPrompted, deviceID: number): boolean {
    const connection = WSACSController.corePool.get(deviceID);
    if (connection === undefined) { return false; }
    connection.ws.send(JSON.stringify(payload));
    return true;
  }
}

function parseRequest(data: ws.Data): WSACSCoreUnprompted {
  const json = JSON.parse(data.toString());
  return json as WSACSCoreUnprompted;
}

async function handleCoreAuthToRequest(request: WSACSCoreUnprompted, deviceID: number): Promise<WSACSServerPrompted> {
  const response: WSACSServerPrompted = { authTo: { channels: [], cardTagID: "" } }
  if (request.authTo === undefined || response.authTo === undefined) {
    response.error = WSACSServerError.SERVER_ERROR;
    return response;
  }

  response.authTo.cardTagID = request.authTo.cardTagID;

  const core = await CoreRepo.getCoreByDeviceID(deviceID);
  if (core === undefined) {
    await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.MEDIUM, { type: "ws-auth-core-not-found", request: request });
    response.error = WSACSServerError.DEVICE_NOT_FOUND;
    return response;
  }

  const user = await UserRepo.getUserByCardTagID(request.authTo.cardTagID);
  if (user === undefined) {
    const device = await DeviceRepo.getDeviceByID(deviceID);
    await AuditLogRepo.createAuditLog(
      `Unknown cardTag {conceal} failed to activate device {device}`,
      "auth",
      device?.makerspaceID,
      { id: 0, label: request.authTo.cardTagID },
      { id: deviceID, label: device?.name ?? "UNKNOWN DEVICE" }
    );
    await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.LOW, { type: "ws-auth-user-not-found", request: request });
    response.error = WSACSServerError.USER_NOT_FOUND;
    return response;
  }

  const controllers = await core.getAccessControllers();

  if (request.authTo.state === AccessControllerState.UNLOCKED) {

    // If this is a welcome reader, instead we welcome the user and return early
    const welcomeSpace = await core.getWelcomeMakerspace();
    if (welcomeSpace !== undefined) {

      await welcomeSpace.welcome(user.id);

      for (let i = 0; i < controllers.length; i++) {
        response.authTo.channels.push({
          id: controllers[i].channelID,
          state: AccessControllerState.UNLOCKED,
          approved: true,
          reason: AccessAttemptReason.WELCOME,
        });
      }

      // If there are no channels, we have to add at least one channel in so
      // the core knows if the person was welcomed
      if (response.authTo.channels.length === 0) {
        response.authTo.channels.push({
          id: 0,
          state: AccessControllerState.UNLOCKED,
          approved: true,
          reason: AccessAttemptReason.WELCOME
        });
      }

      return response;
    }

    // Not a welcome reader so we check access on every channel
    for (let i = 0; i < controllers.length; i++) {
      const accessAttempt = await controllers[i].canUnlock(user.id, true);
      response.authTo.channels.push({
        id: controllers[i].channelID,
        state: accessAttempt.hasAccess ? AccessControllerState.UNLOCKED : controllers[i].state,
        approved: accessAttempt.hasAccess,
        reason: accessAttempt.reason
      });

    }

    return response;
  } else if (
    request.authTo.state === AccessControllerState.ALWAYS_ON
    || request.authTo.state === AccessControllerState.LOCKED_OUT
    || request.authTo.state === AccessControllerState.IDLE
  ) {

    for (let i = 0; i < controllers.length; i++) {
      const controlAttempt = await controllers[i].canControl(user.id);
      response.authTo.channels.push({
        id: controllers[i].channelID,
        state: controlAttempt.canControl ? request.authTo.state : controllers[i].state,
        approved: controlAttempt.canControl,
        reason: controlAttempt.reason
      });
    }

    return response;
  } else {
    response.error = WSACSServerError.BAD_REQUEST;
    return response;
  }
}

async function handleCoreInfoRequest(request: WSACSCoreUnprompted, deviceID: number): Promise<WSACSServerPrompted> {
  const response: WSACSServerPrompted = { info: {} }
  if (request.info === undefined || response.info === undefined) {
    response.error = WSACSServerError.SERVER_ERROR;
    return response;
  }

  const core = await CoreRepo.getCoreByDeviceID(deviceID);
  if (core === undefined) {
    response.error = WSACSServerError.SERVER_ERROR;
    return response;
  }

  for (let i = 0; i < request.info.fields.length; i++) {
    switch (request.info.fields[i]) {
      case CoreInfoRequests.TIME:
        response.info.time = Date.now();
        continue;
      case CoreInfoRequests.STATE:
        const channelStates: { id: number, state: AccessControllerState }[] = [];

        const channels = await core.getAccessControllers();
        for (let i = 0; i < channels.length; i++) {
          channelStates.push({
            id: channels[i].channelID,
            state: channels[i].state
          })
        }

        response.info.state = channelStates;
        continue;
      case CoreInfoRequests.HMI:
        // TODO: GATHER THIS INFO
        continue;
      default:
        response.error = WSACSServerError.BAD_REQUEST;
        continue;
    }
  }

  return response;
}

async function handleCoreMessageRequest(request: WSACSCoreUnprompted, deviceID: number): Promise<void> {
  if (request.message === undefined) {
    return;
  }

  if (!request.message.auditLog) {
    await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.LOW, { type: "ws-message", message: request.message.content });
    return;
  }
  if (typeof request.message.content !== "object") { // The message is an auditlog, should be an object
    return;
  }

  await AuditLogRepo.createUnassocaitedAuditLog(request.message.content.message, request.message.content.category, ...request.message.content.entities);
  return;
}

async function handleCoreStatusRequest(request: WSACSCoreUnprompted, deviceID: number): Promise<void> {
  const core = await CoreRepo.getCoreByDeviceID(deviceID);
  if (request.status === undefined || core === undefined) {
    return;
  }

  if (request.status.regular !== undefined) {
    await core.statusUpdate(request.status.currentCardTag === "" ? undefined : request.status.currentCardTag);
    for (let i = 0; i < request.status.regular.currentStates.length; i++) {
      core.updateControllerState(request.status.regular.currentStates[i].channelID, request.status.regular.currentStates[i].state);
    }
  } else if (request.status.stateChange !== undefined) {
    await core.statusUpdate(request.status.currentCardTag === "" ? undefined : request.status.currentCardTag);
    for (let i = 0; i < request.status.stateChange.channels.length; i++) {
      await core.updateControllerState(request.status.stateChange.channels[i].channelID, request.status.stateChange.channels[i].toState);
    }
    // TODO: Log state change in state change table
    await DeviceLogRepo.createDeviceLog(deviceID, DeviceLogSeverity.LOW, { type: "state-change", request: request })
  }

  if (request.status.config !== undefined) {
    await core.updateConfiguration(request.status.config);
  }
}