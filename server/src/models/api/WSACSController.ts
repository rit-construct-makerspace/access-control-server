import * as ws from "ws";

type ConnectionData = {
  ws: ws.WebSocket;
  deviceID: number;
  toCoreSeqNum: number;
}

export default class WSACSController {
  private static corePool: Map<number, ConnectionData> = new Map();

  private static handleWsClose(event: ws.CloseEvent) {

  }

  private static handleWsError(event: ws.ErrorEvent) {

  }

  private static handleWsMessage(event: ws.MessageEvent) {

  }

  static initConnection(ws: ws.WebSocket, deviceID: number) {
    ws.onclose = this.handleWsClose;
    ws.onerror = this.handleWsError;
    ws.onmessage = this.handleWsMessage;
  }
}