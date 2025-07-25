/**
 * zoneHoursSchema.ts
 * GraphQL declarations for ZoneHours
 */

import { gql } from "graphql-tag";
import { ZoneHoursRow } from "../db/tables.js";

export const ZoneHoursTypeDefs = gql`
  type ZoneHours {
    day: DateTime!
    makerspaceID: ID!
    open: DateTime
    close: DateTime
    closed: Boolean!
  }

  type ZoneDefaultHours {
    dayOfWeek: Int!
    makerspaceID: ID!
    open: DateTime
    close: DateTime
    closed: Boolean!
  }

  extend type Query {
    zoneHoursNextWeek: [ZoneHours]
    zoneHoursOnDay(day: DateTime!, makerspaceID: ID!): ZoneHours
    zoneDefaultHours(makerspaceID: ID!): [ZoneDefaultHours]
    zoneSpecialHours(makerspaceID: ID!): [ZoneHours]
  }

  input DefaultHoursInput {
    dayOfWeek: Int!
    makerspaceID: ID!
    open: DateTime
    close: DateTime
    closed: Boolean!
  }

  input SpecialHoursInput {
    day: DateTime!
    makerspaceID: ID!
    open: DateTime
    close: DateTime
    closed: Boolean!
  }

  extend type Mutation {
    addSpecialHours(hours: SpecialHoursInput!): [ID]
    deleteSpecialHours(day: DateTime, makerspaceID: ID!): ID
    updateDefaultHours(hours: DefaultHoursInput!): [ID]
  }
`;