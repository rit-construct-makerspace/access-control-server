import { AccessControllerState, CoreInputMode } from "../../db/tables.js";
import { AuditLog } from "../logs/AuditLogs.js";

export enum CoreInfoRequests {
  TIME = "TIME",
  STATE = "STATE"
}

export enum CoreActions {
  RESTART = "RESTART",
  SEAL = "SEAL"
}

export enum CoreFiles {
  CERT = "CERT",
  OFFLINE_LIST = "OFFLINE_LIST",
  OTA = "OTA"
}

export enum CoreStateChangeReason {
  AUTHED = "AUTHED",
  OVER_TEMP = "OVER_TEMP",
  CARD_REMOVED = "CARD_REMOVED",
  COMMANDED = "COMMANDED"
}

export interface WSACSCoreUnprompted {
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
      }[]
    },
    currentCardTag: string,
    config?: {
      channels: number;
      inputMode: CoreInputMode;
    }
  };
}

export enum WSACSServerError {
  SERVER_ERROR = "SERVER_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  DEVICE_NOT_FOUND = "DEVICE_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND"
}

export interface WSACSServerPrompted {
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
  }
  error?: WSACSServerError;
}

export interface WSACSServerUnprompted {
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
    },
    getFiles?: CoreFiles[];
  }
}