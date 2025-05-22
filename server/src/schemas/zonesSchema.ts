/**
 * zonesSchema.ts
 * GraphQL declarations for Zones
 */

import { gql } from "graphql-tag";
import { ZoneHoursRow } from "../db/tables.js";

export interface ZoneInput {
  name: string;
  imageUrl: string;
}

export const ZonesTypeDefs = gql`
  type Zone {
    id: ID!
    name: String!
    rooms: [Room]
    hours: [ZoneHours]
    imageUrl: String
  }

  input ZoneInput {
    name: String!
    imageUrl: String
  }

  extend type Query {
    zones: [Zone]
    zoneByID(id: ID!): Zone
  }

  extend type Mutation {
    deleteZone(id: ID!): Zone
    addZone(name: String!): Zone
    updateZone(id: ID!, newZone: ZoneInput): Zone
  }
`;