import expressWs from 'express-ws';
import { Device } from "../../../models/devices/device.js";
import { CoreInfoRequests, WSACSCoreRequest, WSACSServerError, WSACSServerResponse } from '../../../models/api/WSACSFormats.js';
import * as CoreRepo from "../../../repositories/Devices/CoreRepository.js"
import * as AccessAPI from "./access/access.js";
import * as AuditLogRepo from "../../../repositories/AuditLogs/AuditLogRepository.js";

export function registerEndpoints(app: expressWs.Application) {
  app.use("/api/devices/cores", async function (req, res, next) {
    // @ts-expect-error using a field we added
    const device: Device = req.device;

    const core = await CoreRepo.getCoreByDeviceID(device.id);
    if (core === undefined) { return res.sendStatus(404); }

    // @ts-expect-error we are adding a field to req, so TS doesn't know its there and gets upset
    req.core = core;

    return next();
  })

  AccessAPI.registerEndpoints(app);
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