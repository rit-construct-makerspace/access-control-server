/**
 * readersSchema.ts
 * GraphQL declarations for ACS Readers
 */

import { gql } from "graphql-tag";

export const ReaderTypeDefs = gql`
  type PairedMakerspace{
    id: ID!
    name: String
  } 
  type PairedEquipment{
    equipmentID: ID!
    equipmentName: String 
    instanceID: ID!
    instanceName: String
  } 
  type Reader {
    id: ID!
    name: String
    temp: String
    state: String
    user: User
    recentSessionLength: String
    lastStatusReason: String
    scheduledStatusFreq: String
    lastStatusTime: DateTime
    BEVer: String
    FEVer: String
    HWVer: String
    sessionStartTime: DateTime
    SN: String
    readerKeyCycle: Int
    pairTime: DateTime
    targetFirmwareVersion: String

    pairedMakerspace: PairedMakerspace
    pairedEquipment: PairedEquipment
  }
  type ReaderLog{
    id: ID!
    dateTime: DateTime
    reader: Reader
    instance: EquipmentInstance
    log: JSON
  }
  type PairInfo {
    readerKey: String
    name: String
    siteName: String
    certs: String
  }

  extend type Query {
    readers(makerspaceID: ID): [Reader]
    unpairedReaders: [Reader]
    welcomeReadersForMakerspace(makerspaceId: ID!): [Reader]
    makerspaceForWelcomeReader(readerId: ID): Zone
    reader(id: ID!): Reader
    readerLogs(makerspaceID: ID, from: DateTime, to: DateTime, pageOffset: Int, pageLimit: Int): [ReaderLog]
    availableFirmwareVersions: [String]
  }

  extend type Mutation {
    createReader(
      name: String
    ): Reader

    deleteReader(id: ID!): Boolean

    pairReader(
      SN: String!
    ): PairInfo

    pairAsWelcomeReader(readerID: ID!, makerspaceID: ID!): Boolean
    unpairAsWelcomeReader(readerID: ID!, makerspaceID: ID!): Boolean


    updateReader(
      id: ID!
      temp: String
      state: String
      currentUID: String
      recentSessionLength: String
      lastStatusReason: String
      scheduledStatusFreq: String
      SN: String
    ): Reader

    setName(id: ID!, name: String): Reader
    setState(id: ID!, state: String): String
    restartAllReaders(makerspaceID: ID!): Boolean
    setOTAVersion(ids: [ID!]!, otaTag: String!, updateNow: Boolean!): JSON
    identifyReader(id: ID!, doIdentify: Boolean): Boolean
    }
`;