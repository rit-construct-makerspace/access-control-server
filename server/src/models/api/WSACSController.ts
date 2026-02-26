import * as ws from "ws";
import { Request } from "express";
import { WSACSServerRequest } from "./WSACSFormats.js";

type ConnectionData = {
  ws: ws.WebSocket;
  deviceID: number;
}

enum WSAPIError {
  Protocol = 4000,
  InvalidMessageFormat = 4001,
  Unauthenticated = 4002,
  BadBootMessage = 4003,
}

export default class WSACSController {
  private static corePool: Map<number, ConnectionData> = new Map();

  private static handleWsClose(event: ws.CloseEvent, deviceID: number) {
    const connData = this.corePool.get(deviceID);
    try {
      //TODO: put in DB
      if (connData) {
        this.corePool.delete(deviceID);
      }
    } catch (e) {
      console.error(`WSACS: Close Exception: ${e}`) //TODO: put in DB
    }
  }

  private static handleWsError(event: ws.ErrorEvent, deviceID: number) {
    const connData = this.corePool.get(deviceID);
    try {
      //TODO: put in DB
      console.error(`WSACS: websocket error: ${event.error} - ${event.type}: ${event.message}`)
    } catch (e) {
      console.error(`WSACS: Error Handle Exception: ${e}`) //TODO: put in DB
    }
  }

  private static handleWsMessage(event: ws.MessageEvent, deviceID: number) {
    const connData = this.corePool.get(deviceID);
    try {

    } catch (e) {
      console.error(`WSACS: Message Exception: ${e}`) //TODO: put in DB
    }
  }

  static initConnection(ws: ws.WebSocket, req: Request) {
    // @ts-expect-error using our own added field
    const deviceID = req.core?.deviceID;
    if (deviceID === undefined) { ws.close(WSAPIError.Protocol); return; }
    const connData = this.corePool.get(deviceID);
    if (connData !== undefined) {
      connData.ws.close(WSAPIError.Protocol, "Core is attempting to reconnect");
      this.corePool.delete(deviceID);
    }

    this.corePool.set(deviceID, {
      ws: ws,
      deviceID: deviceID
    });

    ws.onclose = (event) => this.handleWsClose(event, deviceID);
    ws.onerror = (event) => this.handleWsError(event, deviceID);
    ws.onmessage = (event) => this.handleWsMessage(event, deviceID);
  }

  static sendCoreMessage(payload: WSACSServerRequest, deviceID: number) {
    const connection = this.corePool.get(deviceID);
    if (connection === undefined) { return; }
    connection.ws.send(JSON.stringify(payload));
  }
}