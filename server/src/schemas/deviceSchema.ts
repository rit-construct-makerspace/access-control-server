import { gql } from "graphql-tag";

export const DeviceTypeDefs = gql`
  type Device {
    id: Int!
    name: String!
    SN: String!
    pairTime: DateTime!
    hardwareVersion: String
    firmwareVersion: String
    targetFirmware: String
    keyCyle: Int!
    makerspaceID: Int!
  }

  enum CoreInputMode {
    INSERT
    TEMP_PRESENT
    TEMP_REMOVE
    TOGGLE
  }

  enum AccessControllerState {
    IDLE
    UNLOCKED
    ALWAYS_ON
    LOCKED_OUT
    FAULT
  }

  type CoreFlags {
    lockWhenIdle: Boolean
    restartWhenIdle: Boolean
  }

  type Core {
    deviceID: Int!
    channels: Int!
    inputMode: CoreInputMode!
    tempDuration: Int!
    currentCardtag: String
    lastStatusTime: DateTime
    sessionStartTime: DateTime
    device: Device!
    instance: EquipmentInstance
    welcomeSpace: Makerspace
    activeUser: User
    state: AccessControllerState!
    flags: CoreFlags!
  }

  enum DispenserError {
    CARD_STUCK
    OUT_OF_CARDS
  }

  type Dispenser {
    deviceID: Int!
    cardsLeft: Int!
    error: DispenserError
    device: Device!
  }

  type AccessController {
    id: Int!
    deviceID: Int!
    channelID: Int!
    state: AccessControllerState!
    device: Device!
    core: Core!
  }

  enum CoreStateInput {
    IDLE
    ALWAYS_ON
    LOCKED_OUT
  }

  enum CoreAction {
    RESTART
    IDENTIFY
    SEAL
  }

  extend type Query {
    getAccessControllerByID(accessControllerID: Int!): AccessController
    getUnpairedAccessControllers(): [AccessController]
  }

  input CoreFlagInput {
    lockWhenIdle: Boolean!
    restartWhenIdle: Boolean!
  }

  extend type Mutation {
    setCoreState(deviceID: Int!, targetState: CoreStateInput): Boolean
    pairGenericDevice(SN: String!, makerspaceID: Int!): String!
    pairCore(SN: String!, makerspaceID: Int!): String!
    pairDispenser(SN: String!, makerspaceID: Int!): String!
    sendCoreAction(deviceID: Int!, action: CoreAction!): Boolean
    sendCoreFlags(deviceID: Int!, flags: CoreFlagInput!): Boolean
  }
`;