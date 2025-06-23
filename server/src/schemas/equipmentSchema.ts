/**
 * equipmentSchema.ts
 * GraphQL declarations for Equipment
 */

import { gql } from "graphql-tag";

export interface EquipmentInput {
  notes: string | null;
  name: string;
  roomID: number;
  moduleIDs: number[];
  imageUrl: string | null;
  sopUrl: string | null
  byReservationOnly: boolean;
  needsWelcome: boolean;
  requiresTrainerApproval: boolean;
}

export const EquipmentTypeDefs = gql`
  type Equipment {
    id: ID!
    name: String!
    archived: Boolean!
    room: Room!
    trainingModules: [TrainingModule]
    addedAt: DateTime!
    inUse: Boolean!
    imageUrl: String
    sopUrl: String
    notes: String
    numAvailable: Int
    numInUse: Int
    byReservationOnly: Boolean
    needsWelcome: Boolean
    requiresTrainerApproval: Boolean
  }

  input EquipmentInput {
    name: String!
    roomID: ID!
    moduleIDs: [ID]
    imageUrl: String!
    sopUrl: String!
    notes: String!
    byReservationOnly: Boolean
    needsWelcome: Boolean
  }

  extend type Query {
    equipments: [Equipment]
    equipment(id: ID!): Equipment
    archivedEquipments: [Equipment]
    archivedEquipment(id: ID!): Equipment
    anyEquipment(id: ID!): Equipment
    correspondingEquipment(readerid: ID, id: ID): Equipment
    allEquipment: [Equipment]
  }

  extend type Mutation {
    addEquipment(equipment: EquipmentInput): Equipment
    updateEquipment(id: ID!, equipment: EquipmentInput): Equipment
    archiveEquipment(id: ID!): Equipment
    publishEquipment(id: ID!): Equipment
  }
`;
