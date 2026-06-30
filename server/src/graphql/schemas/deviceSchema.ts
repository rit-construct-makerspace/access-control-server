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
    restartWhenUnused: Boolean
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
    controllers: [AccessController]
    instance: EquipmentInstance
    welcomeSpace: Makerspace
    activeUser: User
    state: AccessControllerState!
    flags: CoreFlags!
    sealedDeployment: String
    reportedDeployment: String
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
    getUnpairedAccessControllers(makerspaceID: Int!): [AccessController]
    getUnpairedCores(makerspaceID: Int!): [Core]
    getPairedWelcomeCores(makerspaceID: Int!): [Core]
  }

  input CoreFlagInput {
    lockWhenIdle: Boolean!
    restartWhenUnused: Boolean!
  }

  extend type Mutation {
    setCoreState(deviceID: Int!, targetState: CoreStateInput): Boolean
    commandAccessControllerState(accessControllerID: Int! targetState: CoreStateInput!): Boolean
    pairGenericDevice(SN: String!, makerspaceID: Int!): String!
    pairCore(SN: String!, makerspaceID: Int!): String!
    pairDispenser(SN: String!, makerspaceID: Int!): String!
    sendCoreAction(deviceID: Int!, action: CoreAction!): Boolean
    sendCoreFlags(deviceID: Int!, flags: CoreFlagInput!): Boolean
    pairWelcomeDevice(deviceID: Int!, makerspaceID: Int!): Boolean
    unpairWelcomeDevice(deviceID: Int!, makerspaceID: Int!): Boolean
    unpairCore(deviceID: Int!): Boolean
  }
`;