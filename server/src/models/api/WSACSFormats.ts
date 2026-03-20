import { AccessControllerState, CoreInputMode } from "../../db/tables.js";
import { AuditLog } from "../logs/AuditLogs.js";
import { ACSDeployment } from "../ACS/deployment.js";

/**
 * TIME: Current time
 * STATE: State the channels should be in
 * HMI: Information intended for human consumption
 */
export enum CoreInfoRequests {
  TIME = "TIME",
  STATE = "STATE",
  HMI = "HMI"
}

export enum CoreActions {
  RESTART = "RESTART",
  SEAL = "SEAL",
  IDENTIFY = "IDENTIFY"
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
  COMMANDED = "COMMANDED",
  LOCAL = "LOCAL",
  INTEGRITY_FAIL = "INTEGRITY_FAIL",
  FAULT = "FAULT"
}

export interface CoreFlags {
  lockoutWhenIdle: boolean;
  restartWhenIdle: boolean;
}

export interface CoreConfig {
  channels?: {
    id: number;
    tempDuration: number;
  }[];
  inputMode?: CoreInputMode;
  deployment?: ACSDeployment;
  flags?: CoreFlags;
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
    config?: CoreConfig
  };
}

export enum CoreRole {
  WELCOME = "WELCOME",
  EQUIPMENT = "EQUIPMENT"
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
    state?: {
      id: number;
      state: AccessControllerState
    }[];
    hmi?: {
      role: CoreRole;
      makerspace: string;
      channels: {
        channelID: number;
        pairedEntity: string;
      }[];
    }
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
    identifyChannel?: number;
    flags?: CoreFlags;
  },
  update?: {
    config?: {
      inputMode?: CoreInputMode;
      channels?: {
        id: number;
        tempDuration?: number;
      }[];
    },
    getFiles?: CoreFiles[];
  }
}