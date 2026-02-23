import { createCipheriv, scryptSync } from "crypto";
import { DeviceRow } from "../../db/tables.js";

export class Device implements DeviceRow {
  id: number;
  name: string;
  SN: string;
  pairTime: Date;
  hardwareVersion: string | undefined;
  firmwareVersion: string | undefined;
  targetFirmware: string | undefined;
  keyCycle: number;
  makerspaceID: number;

  constructor(row: DeviceRow) {
    this.id = row.id;
    this.name = row.name;
    this.SN = row.SN;
    this.pairTime = row.pairTime;
    this.hardwareVersion = row.hardwareVersion;
    this.firmwareVersion = row.firmwareVersion;
    this.targetFirmware = row.targetFirmware;
    this.keyCycle = row.keyCycle;
    this.makerspaceID = row.makerspaceID;
  }

  async generateKey(): Promise<string> {
    const serverApiPass = process.env.SERVER_API_PASSWORD ?? 'unsecure_server_password';
    const serverKey = scryptSync(serverApiPass, 'makerspace-salt¯\_(ツ)_/¯', 24);
    const algorithm = 'aes-192-cbc';

    const plainText = `device:${this.SN}:${this.keyCycle}`;
    // generate iv from pairTime so when a key differs only by its keyCycle the front part of the hash doesnt look the same
    const iv: ArrayBuffer = (await crypto.subtle.digest('SHA-256', Buffer.from(this.pairTime.toISOString(), 'utf-8'))).slice(0, 16);

    let encrypted = '';
    var cipher;
    cipher = createCipheriv(algorithm, serverKey, Buffer.from(iv));

    cipher.setEncoding('hex');

    cipher.on('data', (chunk) => encrypted += chunk);

    cipher.write(plainText);
    cipher.end();

    return encrypted;
  }
}