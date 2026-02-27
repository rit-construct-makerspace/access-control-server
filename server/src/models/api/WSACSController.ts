import * as ws from "ws";
import { Request } from "express";
import { CoreInfoRequests, WSACSCoreRequest, WSACSServerError, WSACSServerRequest, WSACSServerResponse } from "./WSACSFormats.js";
import * as CoreRepo from "../../repositories/Devices/CoreRepository.js";
import * as UserRepo from "../../repositories/Users/UserRepository.js";
import * as AuditLogRepo from "../../repositories/AuditLogs/AuditLogRepository.js";

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

  private static handleWsMessage(event: ws.MessageEvent, deviceID: number) {
    const connData = this.corePool.get(deviceID);
    try {
      if (event.type !== "text") {
        const response: WSACSServerResponse = { response: { error: WSACSServerError.BAD_REQUEST } };
        return response;
      }

      const request = parseRequest(event.data);

    } catch (e) {
      console.error(`WSACS: Message Exception: ${e}`) //TODO: put in DB
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

  static sendCoreMessage(payload: WSACSServerRequest, deviceID: number) {
    const connection = this.corePool.get(deviceID);
    if (connection === undefined) { return; }
    connection.ws.send(JSON.stringify(payload));
  }
}

function parseRequest(data: ws.Data): WSACSCoreRequest {
  const json = JSON.parse(data.toString());
  return json as WSACSCoreRequest;
}

async function handleCoreAuthToRequest(request: WSACSCoreRequest, deviceID: number): Promise<WSACSServerResponse> {
  const response: WSACSServerResponse = { response: { authTo: { channels: [], cardTagID: "" } } }
  if (request.authTo === undefined || response.response.authTo === undefined) {
    response.response.error = WSACSServerError.SERVER_ERROR;
    return response;
  }

  response.response.authTo.cardTagID = request.authTo.cardTagID;

  const core = await CoreRepo.getCoreByDeviceID(deviceID);
  if (core === undefined) {
    response.response.error = WSACSServerError.DEVICE_NOT_FOUND;
    return response;
  }

  const user = await UserRepo.getUserByCardTagID(request.authTo.cardTagID);
  if (user === undefined) {
    response.response.error = WSACSServerError.USER_NOT_FOUND;
    return response;
  }

  const controllers = await core.getAccessControllers();
}

export async function handleCoreInfoRequest(request: WSACSCoreRequest, deviceID: number): Promise<WSACSServerResponse> {
  const response: WSACSServerResponse = { response: { info: {} } }
  if (request.info === undefined || response.response.info === undefined) {
    response.response.error = WSACSServerError.SERVER_ERROR;
    return response;
  }

  for (let i = 0; i < request.info.fields.length; i++) {
    switch (request.info.fields[i]) {
      case CoreInfoRequests.TIME:
        response.response.info.time = Date.now();
        continue;
      case CoreInfoRequests.OTA_TAG:
        // TODO
        continue;
      case CoreInfoRequests.STATE:
        response.response.info.state = await CoreRepo.getCoreState(deviceID);
    }
  }

  return response;
}

export async function handleCoreMessageRequest(request: WSACSCoreRequest, deviceID: number): Promise<WSACSServerResponse> {
  const response: WSACSServerResponse = { response: { message: { logged: false } } }
  if (request.message === undefined || response.response.message === undefined) {
    response.response.error = WSACSServerError.SERVER_ERROR;
    return response;
  }

  if (!request.message.auditLog) {
    // TODO: just put in DB
    response.response.message.logged = false; // Make true when it actually is being logged
    return response;
  }

  // The message is an auditlog
  if (typeof request.message.content === "string") {
    response.response.error = WSACSServerError.BAD_REQUEST;
    return response;
  }

  await AuditLogRepo.createLog(request.message.content.message, request.message.content.category, ...request.message.content.entities);
  response.response.message.logged = true;
  return response;
}