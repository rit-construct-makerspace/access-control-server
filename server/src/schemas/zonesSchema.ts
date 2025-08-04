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
    items: [InventoryItem]
    imageUrl: String
    trainingModules: [TrainingModule]
  }

  input ZoneInput {
    name: String!
    imageUrl: String
  }

  extend type Query {
    zones(storefrontVisible: Boolean): [Zone]
    zoneByID(id: ID!): Zone
  }

  extend type Mutation {
    deleteZone(id: ID!): Zone
    addZone(name: String!): Zone
    updateZone(id: ID!, newZone: ZoneInput): Zone
    addTrainingToZone(zoneID: ID!, moduleID: ID!): [TrainingModule]
    removeTrainingFromZone(zoneID: ID!, moduleID: ID!): [TrainingModule]
  }
`;