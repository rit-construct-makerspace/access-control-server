import express from "express";
import { ReaderRow } from "../../db/tables.js";
import * as ReaderRepo from "../../repositories/Readers/ReaderRepository.js"
import { createCipheriv, scryptSync } from "crypto";
import * as CardAPI from "./cards/cardApi.js";

const serverApiPass = process.env.SERVER_API_PASSWORD ?? 'unsecure_server_password';
const serverKey = scryptSync(serverApiPass, 'makerspace-salt¯\_(ツ)_/¯', 24);
const algorithm = 'aes-192-cbc';

export async function generateDeviceKey(pairTime: Date, SN: string, keyCycle: number): Promise<string> {
  const plainText = `device:${SN}:${keyCycle}`;
  // generate iv from pairTime so when a key differs only by its keyCycle the front part of the hash doesnt look the same
  const iv: ArrayBuffer = (await crypto.subtle.digest('SHA-256', Buffer.from(pairTime.toISOString(), 'utf-8'))).slice(0, 16);

  let encrypted = '';
  var cipher;
  cipher = createCipheriv(algorithm, serverKey, Buffer.from(iv));

  cipher.setEncoding('hex');

  cipher.on('data', (chunk) => encrypted += chunk);

  cipher.write(plainText);
  cipher.end();

  return encrypted;
}

async function authenticateDevice(device: ReaderRow, submittedKey: string): Promise<boolean> {
  if (device.pairTime === undefined || device.SN === undefined || device.readerKeyCycle === undefined) { return false; }

  const keyToMatch = await generateDeviceKey(device.pairTime, device.SN, device.readerKeyCycle);

  return submittedKey === keyToMatch;
}

export function registerEndpoints(app: express.Application) {
  // Authenticate any devices using the devices endpoint
  app.all("/api/devices", async function (req, res, next) {
    const SNHeader = 'device-sn';
    const KeyHeader = 'device-key';
    if (!req.headers[SNHeader] || !req.headers[KeyHeader]) { return res.sendStatus(401); }

    const SN = req.headers[SNHeader];
    const Key = req.headers[KeyHeader];
    if (typeof SN !== "string" || typeof Key !== "string") { return res.status(401).send(); }

    const device = await ReaderRepo.getReaderBySN(SN);
    if (device === undefined) { return res.sendStatus(404); }

    const authed = authenticateDevice(device, Key);
    if (!authed) { return res.sendStatus(403); }

    // @ts-expect-error we are adding a field to req, so TS doesn't know its there and gets upset
    req.device = device;

    return next();
  })

  CardAPI.registerEndpoints(app);
}