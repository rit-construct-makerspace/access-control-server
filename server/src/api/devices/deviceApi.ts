import express from "express";
import * as DeviceRepo from "../../repositories/Devices/DeviceRepository.js"
import * as CardAPI from "./cards/cardApi.js";
import { Device } from "../../models/devices/device.js";

export async function authenticateDevice(device: Device, submittedKey: string): Promise<boolean> {
  if (device.pairTime === undefined || device.SN === undefined || device.keyCycle === undefined) { return false; }

  const keyToMatch = await device.generateKey();

  return submittedKey === keyToMatch;
}

export function registerEndpoints(app: express.Application) {
  // Authenticate any devices using the devices endpoint
  app.use("/api/devices", async function (req, res, next) {
    const SNHeader = 'device-sn';
    const KeyHeader = 'device-key';
    if (!req.headers[SNHeader] || !req.headers[KeyHeader]) { return res.sendStatus(401); }

    const SN = req.headers[SNHeader];
    const Key = req.headers[KeyHeader];
    if (typeof SN !== "string" || typeof Key !== "string") { return res.status(401).send(); }

    const device = await DeviceRepo.getDeviceBySN(SN);
    if (device === undefined) { return res.sendStatus(404); }

    const authed = authenticateDevice(device, Key);
    if (!authed) { return res.sendStatus(403); }

    // @ts-expect-error we are adding a field to req, so TS doesn't know its there and gets upset
    req.device = device;

    return next();
  })

  CardAPI.registerEndpoints(app);
}