import expressWs from 'express-ws';
import WSACSController from '../../../../models/api/WSACS/WSACSController.js';

export function registerEndpoints(app: expressWs.Application) {
  app.ws("/api/devices/cores/access/ws", WSACSController.initConnection);
}