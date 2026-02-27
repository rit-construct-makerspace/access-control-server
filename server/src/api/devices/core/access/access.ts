import expressWs from 'express-ws';
import WSACSController from '../../../../models/api/WSACSController.js';
import { WSACSCoreRequest, WSACSServerError, WSACSServerResponse } from '../../../../models/api/WSACSFormats.js';
import * as CoreRepo from "../../../../repositories/Devices/CoreRepository.js";
import * as UserRepo from "../../../../repositories/Users/UserRepository.js";

export function registerEndpoints(app: expressWs.Application) {
  app.ws("/api/devices/cores/access/ws", WSACSController.initConnection);
}

export async function handleCoreAuthToRequest(request: WSACSCoreRequest, deviceID: number): Promise<WSACSServerResponse> {
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