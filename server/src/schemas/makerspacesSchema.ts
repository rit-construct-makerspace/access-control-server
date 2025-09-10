/**
 * makerspacesSchema.ts
 * GraphQL declarations for Makerspaces
 */

import { gql } from "graphql-tag";

export interface MakerspaceInput {
  name: string;
  subtitle: string | null;
  location: string | null;
  imageUrl: string;
}

export const MakerspacesTypeDefs = gql`
  type Makerspace {
    id: ID!
    name: String!
    subtitle: String
    location: String
    rooms: [Room]
    hours: [MakerspaceHours]
    items: [InventoryItem]
    imageUrl: String
    trainingModules: [TrainingModule]
  }

  input MakerspaceInput {
    name: String!
    subtitle: String
    location: String
    imageUrl: String
  }

  extend type Query {
    makerspaces(storefrontVisible: Boolean): [Makerspace]
    makerspaceByID(id: ID!): Makerspace
  }

  extend type Mutation {
    deleteMakerspace(id: ID!): Makerspace
    addMakerspace(name: String!): Makerspace
    archiveMakerspace(id: ID!): Makerspace
    updateMakerspace(id: ID!, newMakerspace: MakerspaceInput): Makerspace
    addTrainingToMakerspace(makerspaceID: ID!, moduleID: ID!): [TrainingModule]
    removeTrainingFromMakerspace(makerspaceID: ID!, moduleID: ID!): [TrainingModule]
  }
`;