import { AccessControllerState, CoreInputMode } from "../../knex/tables.js"
import { ACSDeployment } from "../ACS/deployment.js";

export interface CoreStatusReport {
  channels: {
    channelID: number,
    state: AccessControllerState
  }[];
  currentCardTag: string;
  hobbsTime: number
}

enum CoreStateChangeReason {
  AUTHED = "AUTHED",
  OVER_TEMP = "OVER_TEMP",
  CARD_REMOVED = "CARD_REMOVED",
  COMMANDED = "COMMANDED",
  LOCAL = "LOCAL",
  INTEGRITY_FAIL = "INTEGRITY_FAIL",
  FAULT = "FAULT"
}

export interface CoreStateChangeReport {
  channels: {
    channelID: number,
    fromState: AccessControllerState,
    toState: AccessControllerState,
    reason: CoreStateChangeReason
  }[];
  currentCardTag: string;
}

export interface CoreLogRequest {
  auditLog: boolean;
  message: string;
  category?: string;
}

export interface CoreAuthToRequest {
  state: AccessControllerState,
  cardTagID: string;
}

export interface CoreFlags {
  lockWhenIdle: boolean;
  restartWhenUnused: boolean;
  welcoming: boolean;
}

export interface CoreConfigReport {
  channels?: {
    channelID: number;
    tempDuration: number;
  }[];
  inputMode?: CoreInputMode;
  deployment?: ACSDeployment;
  flags?: CoreFlags;
  firmware?: string;
}

/**
 * TIME: Current time
 * STATE: State the channels should be in
 * HMI: Information intended for human consumption
 */
export enum CoreInfoOptions {
  TIME = "TIME",
  STATE = "STATE",
  HMI = "HMI",
  FLAGS = "FLAGS",
  HOBBS_TIME = "HOBBS_TIME"
}

export interface CoreInfoRequest {
  fields: CoreInfoOptions[];
}

/**
 * Shape of what the server will send to the core in response to
 * an authTo request
 */
export interface ServerAuthToResponse {
  channels: {
    channelID: number;
    state: AccessControllerState;
    approved: boolean;
    reason: string;
  }[];
  cardTagID: string;
}

export enum CoreFiles {
  CERT = "CERT",
  OFFLINE_LIST = "OFFLINE_LIST",
  OTA = "OTA"
}

/**
 * Shape of what the server sends to the core when the server
 * wants the core to update its configuration
 */
export interface ServerConfigUpdateRequest {
  inputMode?: CoreInputMode;
  channels?: {
    id: number;
    tempDuration?: number;
    getFiles?: CoreFiles[];
  }[];
}

export enum CoreActions {
  RESTART = "RESTART",
  SEAL = "SEAL",
  IDENTIFY = "IDENTIFY",
  SCHEDULED_RESTART = "SCHEDULED_RESTART"
}

/**
 * Shape of what the server sends to the core when the server
 * wants to command the core to take some action
 */
export interface ServerCommand {
  toState?: {
    id: number,
    state: AccessControllerState
  }[];
  action?: CoreActions;
  identifyChannel?: number;
  flags?: CoreFlags;
}

export enum CoreRole {
  WELCOME = "WELCOME",
  EQUIPMENT = "EQUIPMENT"
}

/**
 * Shape of what the server sends the core in response to
 * an info request
 */
export interface ServerInfoResponse {
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
  };
  flags?: CoreFlags;
  hobbsTime?: number
}

export interface WelcomeRequest {
  cardTagID: string;
}

export interface WelcomeResponse {
  welcomed: boolean;
  cardTagID: string;
}