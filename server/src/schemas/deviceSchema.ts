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
`;