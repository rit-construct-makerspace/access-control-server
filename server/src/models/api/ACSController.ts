import { Core } from "../devices/core.js";
import { Device } from "../devices/device.js";
import { ServerAuthToResponse, ServerCommand, ServerConfigUpdateRequest, ServerInfoResponse, WelcomeResponse } from "./ACSFormats.js";

export abstract class ACSController {
  abstract sendCoreAuthToResponse(core: Core, response: ServerAuthToResponse): boolean;
  abstract sendCoreConfigUpdate(core: Core, update: ServerConfigUpdateRequest): boolean;
  abstract sendCoreInfoResponse(core: Core, response: ServerInfoResponse): boolean;
  abstract sendCoreCommand(core: Core, command: ServerCommand): boolean;
  abstract sendWelcomeResponse(device: Device, response: WelcomeResponse): boolean;
  abstract getName(): string;
}