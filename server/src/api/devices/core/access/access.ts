import expressWs from 'express-ws';
import WSACSController from '../../../../models/api/WSACSController.js';
import { CoreInfoRequests, WSACSCoreRequest, WSACSServerError, WSACSServerResponse } from '../../../../models/api/WSACSFormats.js';
import * as CoreRepo from "../../../../repositories/Devices/CoreRepository.js";

export function registerEndpoints(app: expressWs.Application) {
  app.ws("/api/devices/cores/access/ws", WSACSController.initConnection);
}

export async function handleCoreInfoRequest(request: WSACSCoreRequest, deviceID: number): Promise<WSACSServerResponse> {
  const response: WSACSServerResponse = { response: { info: {} } }
  if (request.info === undefined || response.response.info === undefined) {
    response.response.error = WSACSServerError.PARSE_FAIL;
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