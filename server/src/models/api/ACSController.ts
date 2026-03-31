import { Core } from "../devices/core.js";
import { ServerAuthToResponse, ServerCommand, ServerConfigUpdateRequest, ServerInfoResponse } from "./ACSFormats.js";

export abstract class ACSController {
  abstract sendCoreAuthToResponse(core: Core, response: ServerAuthToResponse): boolean;
  abstract sendCoreConfigUpdate(core: Core, update: ServerConfigUpdateRequest): boolean;
  abstract sendCoreInfoResponse(core: Core, response: ServerInfoResponse): boolean;
  abstract sendCoreCommand(core: Core, command: ServerCommand): boolean;
  abstract getName(): string;
}