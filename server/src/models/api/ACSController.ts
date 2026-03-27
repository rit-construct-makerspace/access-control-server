import { Core } from "../devices/core.js";
import { ServerAuthToResponse, ServerCommand, ServerConfigUpdateRequest, ServerInfoResponse } from "./ACSFormats.js";

export interface ACSController {
  sendCoreAuthToResponse(core: Core, response: ServerAuthToResponse): boolean;
  sendCoreConfigUpdate(core: Core, update: ServerConfigUpdateRequest): boolean;
  sendCoreInfoResponse(core: Core, response: ServerInfoResponse): boolean;
  sendCoreCommand(core: Core, command: ServerCommand): boolean;
}