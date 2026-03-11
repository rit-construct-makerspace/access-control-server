import expressWs from 'express-ws';
import * as DeviceAPI from "./devices/deviceApi.js";

export function registerEndpoints(app: expressWs.Application) {
  DeviceAPI.registerEndpoints(app);
}