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
    TEMP
    TOGGLE
  }

  enum AccessControllerState {
    IDLE
    UNLOCKED
    ALWAYS_ON
    LOCKED_OUT
    FAULT
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

  enum CoreStateInput {
    IDLE
    ALWAYS_ON
    LOCKED_OUT
  }

  extend type Mutation {
    setCoreState(deviceID: Int!, targetState: CoreStateInput): Boolean
    pairCore(SN: String!, makerspaceID: Int!): String!
  }
`;