import { gql } from "@apollo/client";

export interface Reader {
  helpRequested: boolean;
  id: number,
  machineID: string,
  machineType: string,
  name: string,
  zone: string
  temp: number,
  state: string,
  user: {id: number, firstName: string, lastName: string}
  recentSessionLength: number,
  lastStatusReason: string,
  scheduledStatusFreq: number,
  lastStatusTime: string,
  BEVer: string,
  FEVer: string,
  HWVer: string,
  SN: string,
  sessionStartTime: number,
  targetFirmwareVersion?: string,
}

export const GET_READERS = gql`
  query GetReaders {
    readers {
      id
      machineID
      machineType
      name
      zone
      temp
      state
      user {
        id
        firstName
        lastName
      }
      recentSessionLength
      lastStatusReason
      scheduledStatusFreq
      lastStatusTime
      helpRequested
      BEVer
      FEVer
      HWVer
      sessionStartTime
      SN
      readerKeyCycle
      pairTime
      targetFirmwareVersion
    }
  }
`;
export const GET_READER_BY_ID = gql`
  query GetReaderByID($id: ID!) {
    reader(id: $id) {
      id
      machineID
      machineType
      name
      zone
      temp
      state
      user {
        id
        firstName
        lastName
      }
      recentSessionLength
      lastStatusReason
      scheduledStatusFreq
      lastStatusTime
      helpRequested
      BEVer
      FEVer
      HWVer
      sessionStartTime
      SN
      readerKeyCycle
      pairTime
      targetFirmwareVersion
    }
  }
`;


export const GET_READER_LOGS = gql`
query GetReaderLogs($makerspaceID: ID, $from: DateTime, $to: DateTime, $offset: Int, $limit: Int){
  readerLogs(makerspaceID: $makerspaceID, from: $from, to: $to, pageOffset: $offset, pageLimit: $limit) {
    id
    dateTime
    reader {
      id
      name
    }
    instance {
      id
      name
      equipment {
        id
        name
        room {
          zone {
            id
            name
          }
        }
      }
    }
    log
  }
}`;


export const GET_UNPAIRED_READERS = gql`
  query GetUnpairedReaders {
    unpairedReaders {
      id
      machineID
      machineType
      name
      zone
      temp
      state
      user {
        id
        firstName
        lastName
      }
      recentSessionLength
      lastStatusReason
      scheduledStatusFreq
      lastStatusTime
      helpRequested
      BEVer
      FEVer
      HWVer
      sessionStartTime
      SN
      readerKeyCycle
      pairTime
      targetFirmwareVersion
    }
  }
`

export const GET_WELCOME_READERS_FOR_MAKERSPACE = gql`
query GetWelcomeReadersForMakerspace($makerspaceId: ID!) {
  welcomeReadersForMakerspace(makerspaceId: $makerspaceId){
    id
    name
    machineID
    machineType
    zone
    temp
    state
    user {
      id      
      firstName
      lastName
    }
    recentSessionLength
    lastStatusReason
    scheduledStatusFreq
    lastStatusTime
    helpRequested
    BEVer
    FEVer
    HWVer
    sessionStartTime
    SN
    readerKeyCycle
    pairTime
    targetFirmwareVersion
  }
}
`;

export const CREATE_READER = gql`
  mutation CreateReader(
    $id: ID!,
    $machineID: string,
    $machineType: string,
    $name: string,
    $zone: string,
  ) {
    createReader(
      id: $id,
      machineID: $machineID,
      machineType: $machineType,
      name: $name,
      zone: $zone,
    ) {
      id
      machineID
      machineType
      name
      zone
    }
  }
`;

export const DELETE_READER = gql`
  mutation DeleteReader($id: ID!){
    deleteReader(id: $id)
  }
`
export const PAIR_AS_WELCOME_READER = gql`
mutation PairAsWelcomeReader($readerId: ID!, $makerspaceId: ID!) {
  pairAsWelcomeReader(readerID: $readerId, makerspaceID: $makerspaceId)
}
`;

export const UNPAIR_AS_WELCOME_READER = gql`
mutation UnpairAsWelcomeReader($readerId: ID!, $makerspaceId: ID!) {
  unpairAsWelcomeReader(readerID: $readerId, makerspaceID: $makerspaceId)
}
`;

export const PAIR_READER = gql`
  mutation PairReader(
    $SN: String!,
  ) {
    pairReader(
      SN: $SN,
    ) {
      readerKey
      name
      siteName
      certs
    }
  }
`;



export const SET_READER_NAME = gql`
  mutation SetReaderName($id: ID!, $name: string) {
    setName(id: $id, name: $name) {
      id
      machineID
      machineType
      name
      zone
      temp
      state
      currentUID
      recentSessionLength
      lastStatusReason
      scheduledStatusFreq
      lastStatusTime
    }
  }
`;

export const IDENTIFY_READER = gql`
  mutation IdentifyReader($id:ID!, $doIdentify: Boolean!){
    identifyReader(id:$id, doIdentify:$doIdentify)
  }
`;

export const SET_READER_STATE = gql`
  mutation SetReaderState($id: ID!, $state: String) {
    setState(id: $id, state: $state)
  }
`;