import expressWs from 'express-ws';
import { Device } from "../../../models/devices/device.js";
import * as CoreRepo from "../../../repositories/Devices/CoreRepository.js"
import * as AccessAPI from "./access/access.js";

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