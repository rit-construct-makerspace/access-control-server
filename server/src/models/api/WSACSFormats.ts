import { AccessControllerState, CoreInputMode } from "../../db/tables.js";
import { AuditLog } from "../logs/AuditLogs.js";

export enum CoreInfoRequests {
  TIME = "TIME",
  STATE = "STATE",
  OTA_TAG = "OTA_TAG"
}

export enum CoreActions {
  RESTART = "RESTART",
  LOCK_WHEN_IDLE = "LOCK_WHEN_IDLE"
}

export enum CoreFiles {
  CERT = "CERT",
  OFFLINE_LIST = "OFFLINE_LIST"
}

export interface WSACSCoreRequest {
  authTo?: {
    state: AccessControllerState;
    cardTagID: string;
  };
  info?: {
    fields: CoreInfoRequests[];
  };
  message?: {
    content: AuditLog | string;
    auditLog: boolean;
  };
}

export enum WSACSServerError {
  SERVER_ERROR = "SERVER_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  DEVICE_NOT_FOUND = "DEVICE_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND"
}

export interface WSACSServerResponse {
  response: {
    authTo?: {
      channels: {
        id: number;
        state: AccessControllerState;
        approved: boolean;
        reason: string;
      }[];
      cardTagID: string;
    },
    info?: {
      time?: number;
      state?: AccessControllerState;
      otaTag?: string;
    },
    message?: {
      logged: boolean
    }
    error?: WSACSServerError;
  }
}

export interface WSACSServerRequest {
  command?: {
    toState?: {
      id: number,
      state: AccessControllerState
    }[];
    action?: CoreActions;
  },
  update?: {
    config?: {
      inputMode?: CoreInputMode;
      tempDuration?: number;
      targetOta?: string;
    },
    getFiles?: CoreFiles[];
  }
}