/**
 * makerspaceHoursSchema.ts
 * GraphQL declarations for MakerspaceHours
 */

import { gql } from "graphql-tag";

export const MakerspaceHoursTypeDefs = gql`
  type MakerspaceHours {
    day: DateTime!
    makerspaceID: ID!
    open: String
    close: String
    closed: Boolean!
  }

  type MakerspaceDefaultHours {
    dayOfWeek: Int!
    makerspaceID: ID!
    open: String
    close: String
    closed: Boolean!
  }

  extend type Query {
    makerspaceHoursNextWeek: [Makerspace]
    makerspaceHoursOnDay(day: DateTime!, makerspaceID: ID!): MakerspaceHours
    makerspaceDefaultHours(makerspaceID: ID!): [MakerspaceDefaultHours]
    makerspaceSpecialHours(makerspaceID: ID!): [MakerspaceHours]
  }

  input DefaultHoursInput {
    dayOfWeek: Int!
    makerspaceID: ID!
    open: String
    close: String
    closed: Boolean!
  }

  input SpecialHoursInput {
    day: DateTime!
    makerspaceID: ID!
    open: String
    close: String
    closed: Boolean!
  }

  extend type Mutation {
    addSpecialHours(hours: SpecialHoursInput!): Boolean
    deleteSpecialHours(day: DateTime, makerspaceID: ID!): Boolean
    updateDefaultHours(hours: DefaultHoursInput!): Boolean
  }
`;