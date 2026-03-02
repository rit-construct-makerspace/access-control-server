import { AccessControllerState, CoreInputMode } from "../../db/tables.js";
import { AuditLog } from "../logs/AuditLogs.js";

export enum CoreInfoRequests {
  TIME = "TIME",
  STATE = "STATE"
}

export enum CoreActions {
  RESTART = "RESTART",
  LOCK_WHEN_IDLE = "LOCK_WHEN_IDLE"
}

export enum CoreFiles {
  CERT = "CERT",
  OFFLINE_LIST = "OFFLINE_LIST"
}

export enum CoreStateChangeReason {
  AUTHED = "AUTHED",
  OVER_TEMP = "OVER_TEMP",
  CARD_REMOVED = "CARD_REMOVED",
  COMMANDED = "COMMANDED"
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
  status?: {
    regular?: {
      currentCardTag: string,
      currentStates: {
        state: AccessControllerState,
        channelID: number
      }[]
    },
    stateChange?: {
      channels: {
        fromState: AccessControllerState,
        toState: AccessControllerState,
        reason: CoreStateChangeReason,
        channelID: number
      }
    }
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