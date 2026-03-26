import { AccessControllerState, CoreInputMode } from "../../db/tables.js"
import { ACSDeployment } from "../ACS/deployment.js";

export interface CoreStatusReport {
  channels: {
    channelID: number,
    state: AccessControllerState
  }[];
  currentCardTag: string;
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
  restartWhenIdle: boolean;
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
  HMI = "HMI"
}

export interface CoreInfoRequest {
  fields: CoreInfoOptions[];
}