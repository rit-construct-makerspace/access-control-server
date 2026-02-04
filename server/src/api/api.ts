import express from "express";
import * as DeviceAPI from "./devices/deviceApi.js";

export function registerEndpoints(app: express.Application) {
  DeviceAPI.registerEndpoints(app);
}