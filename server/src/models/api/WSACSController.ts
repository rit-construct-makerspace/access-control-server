import * as ws from "ws";
import { Request } from "express";
import { CoreInfoRequests, WSACSCoreUnprompted, WSACSServerError, WSACSServerUnprompted, WSACSServerPrompted } from "./WSACSFormats.js";
import * as CoreRepo from "../../repositories/Devices/CoreRepository.js";
import * as UserRepo from "../../repositories/Users/UserRepository.js";
import * as AuditLogRepo from "../../repositories/AuditLogs/AuditLogRepository.js";
import { AccessControllerState } from "../../db/tables.js";
import { AccessAttemptReason } from "../devices/accessController.js";

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

  private static handleWsClose(event: ws.CloseEvent, deviceID: number) {
    const connData = this.corePool.get(deviceID);
    try {
      //TODO: put in DB
      if (connData) {
        this.corePool.delete(deviceID);
      }
    } catch (e) {
      console.error(`WSACS: Close Exception: ${e}`) //TODO: put in DB
    }
  }

  private static handleWsError(event: ws.ErrorEvent, deviceID: number) {
    const connData = this.corePool.get(deviceID);
    try {
      //TODO: put in DB
      console.error(`WSACS: websocket error: ${event.error} - ${event.type}: ${event.message}`)
    } catch (e) {
      console.error(`WSACS: Error Handle Exception: ${e}`) //TODO: put in DB
    }
  }

  private static async handleWsMessage(event: ws.MessageEvent, deviceID: number) {
    try {
      if (event.type !== "text") {
        const response: WSACSServerPrompted = { error: WSACSServerError.BAD_REQUEST };
        WSACSController.sendCoreResponse(response, deviceID);
        return;
      }

      const request = parseRequest(event.data);
      if (request.authTo !== undefined) {
        WSACSController.sendCoreResponse(await handleCoreAuthToRequest(request, deviceID), deviceID);
      } else if (request.info !== undefined) {
        WSACSController.sendCoreResponse(await handleCoreInfoRequest(request, deviceID), deviceID);
      } else if (request.message !== undefined) {
        // A message request does not require a response from the server
        handleCoreMessageRequest(request, deviceID);
      } else if (request.status !== undefined) {
        // A status requets does not require a response from the server
        handleCoreStatusRequest(request, deviceID);
      } else {
        const response: WSACSServerPrompted = { error: WSACSServerError.BAD_REQUEST };
        WSACSController.sendCoreResponse(response, deviceID);
        return;
      }

    } catch (e) {
      console.error(`WSACS: Message Exception: ${e}`) //TODO: put in DB
      const response: WSACSServerPrompted = { error: WSACSServerError.SERVER_ERROR };
      WSACSController.sendCoreResponse(response, deviceID);
    }
  }

  static initConnection(ws: ws.WebSocket, req: Request) {
    // @ts-expect-error using our own added field
    const deviceID = req.core?.deviceID;
    if (deviceID === undefined) { ws.close(WSAPIError.Protocol); return; }
    const connData = this.corePool.get(deviceID);
    if (connData !== undefined) {
      connData.ws.close(WSAPIError.Protocol, "Core is attempting to reconnect");
      this.corePool.delete(deviceID);
    }

    this.corePool.set(deviceID, {
      ws: ws,
      deviceID: deviceID
    });

    ws.onclose = (event) => this.handleWsClose(event, deviceID);
    ws.onerror = (event) => this.handleWsError(event, deviceID);
    ws.onmessage = (event) => this.handleWsMessage(event, deviceID);
  }

  static sendCoreRequest(payload: WSACSServerUnprompted, deviceID: number) {
    const connection = this.corePool.get(deviceID);
    if (connection === undefined) { return; }
    connection.ws.send(JSON.stringify(payload));
  }

  static sendCoreResponse(payload: WSACSServerPrompted, deviceID: number) {
    const connection = this.corePool.get(deviceID);
    if (connection === undefined) { return; }
    connection.ws.send(JSON.stringify(payload));
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
    response.error = WSACSServerError.DEVICE_NOT_FOUND;
    return response;
  }

  const user = await UserRepo.getUserByCardTagID(request.authTo.cardTagID);
  if (user === undefined) {
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

      return response;
    }

    // Not a welcome reader so we check access on every channel
    for (let i = 0; i < controllers.length; i++) {
      const accessAttempt = await controllers[i].canUnlock(user.id);
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

  for (let i = 0; i < request.info.fields.length; i++) {
    switch (request.info.fields[i]) {
      case CoreInfoRequests.TIME:
        response.info.time = Date.now();
        continue;
      case CoreInfoRequests.STATE:
        response.info.state = await CoreRepo.getCoreState(deviceID);
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
    // TODO: just put in DB, the message is not an audit log
    return;
  }
  if (typeof request.message.content === "string") { // The message is an auditlog, should not be string
    return;
  }

  await AuditLogRepo.createLog(request.message.content.message, request.message.content.category, ...request.message.content.entities);
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
      core.updateControllerState(request.status.stateChange.channels[i].channelID, request.status.stateChange.channels[i].toState);
    }
    // TODO: Log state change
  }

  if (request.status.config !== undefined) {
    // Update recorded config
  }
}