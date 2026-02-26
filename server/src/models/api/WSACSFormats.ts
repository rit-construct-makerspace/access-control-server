import { AccessControllerState, CoreInputMode } from "../../db/tables.js";

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

export interface CoreRequest {
  authTo?: {
    state: AccessControllerState;
    cardTagID: string;
  };
  info?: {
    fields: CoreInfoRequests[];
  };
  message?: {
    content: string;
    auditLog: boolean
  };
}

export interface ServerResponse {
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
  }
}

export interface ServerRequest {
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

// I don't think we need this? tracking it would also be messy imo
export interface CoreResponse {
  response: {
    command?: {
      toState?: {
        success: boolean;
      },
      action?: {
        success: boolean;
      }
    },
    update?: {
      config?: {

      },

    }
  }
}