import { gql } from "@apollo/client";
import { CurrentUser } from "../common/CurrentUserProvider";
import { EquipmentInstance } from "./equipmentInstanceQueries";
import { FullMakerspace } from "./makerspaceQueries";

export interface Device {
  id: number;
  name: string;
  SN: string;
  pairTime: Date;
  hardwareVersion: string | undefined;
  firmwareVersion: string | undefined;
  targetFirmware: string | undefined;
  keyCycle: number;
  makerspaceID: number;
}

export enum CoreInputMode {
  INSERT = "INSERT",
  TEMP_PRESENT = "TEMP_PRESENT",
  TEMP_REMOVE = "TEMP_REMOVE",
  TOGGLE = "TOGGLE"
}

export enum AccessControllerState {
  IDLE = "IDLE",
  UNLOCKED = "UNLOCKED",
  ALWAYS_ON = "ALWAYS_ON",
  LOCKED_OUT = "LOCKED_OUT",
  FAULT = "FAULT"
}

export interface CoreFlags {
  lockWhenIdle?: boolean;
  restartWhenUnused?: boolean;
}

export interface Core {
  deviceID: number;
  channels: number;
  inputMode: CoreInputMode;
  tempDuration: number;
  currentCardTag: string;
  lastStatusTime: Date;
  sessionStartTime: Date;
  device: Device;
  controllers: AccessController[];
  instance: EquipmentInstance | undefined;
  welcomeSpace: FullMakerspace | undefined;
  activeUser: CurrentUser | undefined;
  state: AccessControllerState;
  flags: CoreFlags;
  sealedDeployment: string;
  reportedDeployment: string;
}

export interface AccessController {
  id: number;
  channelID: number;
  deviceID: number;
  state: AccessControllerState;
  device: Device;
  core: Core;
}

enum DispenserError {
  CARD_STUCK = "CARD_STUCK",
  OUT_OF_CARDS = "OUT_OF_CARDS"
}

export interface Dispenser {
  deviceID: number;
  cardsLeft: number;
  error: DispenserError;
  device: Device;
}

export enum CoreActions {
  RESTART = "RESTART",
  SEAL = "SEAL",
  IDENTIFY = "IDENTIFY"
}

export const SET_CORE_STATE = gql`
  mutation SetCoreState($deviceID: Int!, $targetState: CoreStateInput) {
    setCoreState(deviceID: $deviceID, targetState: $targetState)
  }
`;

export const COMMAND_CONTROLLER_STATE = gql`
  mutation CommandControllerState($accessControllerID: Int!, $targetState: CoreStateInput!) {
    commandAccessControllerState(accessControllerID: $accessControllerID, targetState: $targetState)
  }
`;

export const PAIR_CORE = gql`
  mutation PairCore($SN: String!, $makerspaceID: Int!) {
    pairCore(SN: $SN, makerspaceID: $makerspaceID)
  }
`;

export const PAIR_GENERIC_DEVICE = gql`
  mutation PairGenericDevice($SN: String!, $makerspaceID: Int!) {
    pairGenericDevice(SN: $SN, makerspaceID: $makerspaceID)
  }
`;

export const PAIR_DISPENSER = gql`
  mutation PairDispenser($SN: String!, $makerspaceID: Int!) {
    pairDispenser(SN: $SN, makerspaceID: $makerspaceID)
  }
`;

export const SEND_CORE_ACTION = gql`
  mutation SendCoreAction($deviceID: Int!, $action: CoreAction!) {
    sendCoreAction(deviceID: $deviceID, action: $action)
  }
`;

export const SEND_CORE_FLAGS = gql`
  mutation SendCoreFlags($deviceID: Int!, $flags: CoreFlagInput!) {
    sendCoreFlags(deviceID: $deviceID, flags: $flags)
  }
`;

export const GET_ACCESS_CONTROLLER_BY_ID = gql`
  query GetAccessControllerByID($accessControllerID: Int!) {
    getAccessControllerByID(accessControllerID: $accessControllerID) {
      id
      channelID
      state
      device {
        id
        name
        makerspaceID
      }
      core {
        deviceID
        activeUser {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

export const GET_UNPAIRED_ACCESS_CONTROLLERS = gql`
  query GetUnpairedAccessControllers($makerspaceID: Int!) {
    getUnpairedAccessControllers(makerspaceID: $makerspaceID) {
      id
      channelID
      device {
        id
        name
      }
    }
  }
`;

export const GET_UNPAIRED_CORES = gql`
  query GetUnpairedCores($makerspaceID: Int!) {
    getUnpairedCores(makerspaceID: $makerspaceID) {
      deviceID
      device {
        id
        name
      }
    }
  }
`

export const GET_PAIRED_WELCOME_CORES = gql`
  query GetPairedWelcomeCores($makerspaceID: Int!) {
    getPairedWelcomeCores(makerspaceID: $makerspaceID) {
      deviceID
      device {
        id
        name
      }
    }
  }
`;

export const PAIR_WELCOME_DEVICE = gql`
  mutation PairWelcomeDevice($deviceID: Int!, $makerspaceID: Int!) {
    pairWelcomeDevice(deviceID: $deviceID, makerspaceID: $makerspaceID)
  }
`;

export const UNPAIR_WELCOME_DEVICE = gql`
  mutation UnpairWelcomeDevice($deviceID: Int!, $makerspaceID: Int!) {
    unpairWelcomeDevice(deviceID: $deviceID, makerspaceID: $makerspaceID)
  }
`;

export const UNPAIR_CORE = gql`
  mutation UnpairCore($deviceID: Int!) {
    unpairCore(deviceID: $deviceID)
  }
`;