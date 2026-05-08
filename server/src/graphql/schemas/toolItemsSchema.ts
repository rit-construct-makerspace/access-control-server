/**
 * toolItemsSchema.ts
 * GraphQL declarations for ToolItemInstances and ToolItemType
 */

import { gql } from "graphql-tag";

export interface ToolItemTypeInput {
  name: string;
  defaultLocationRoomID: number;
  defaultLocationDescription: string;
  description: string;
  checkoutNote: string;
  checkinNote: string;
  allowCheckout: boolean;
  imageUrl: string;
}

export interface ToolItemInstanceInput {
  typeID: number;
  uniqueIdentifier: string;
  locationRoomID: number;
  locationDescription: string;
  condition: string;
  status: string;
  notes: string;
}

export const ToolItemTypeDefs = gql`
  type ToolItemType {
    id: ID
    name: String!
    defaultLocationRoom: Room
    defaultLocationDescription: String
    description: String
    checkoutNote: String
    checkinNote: String
    allowCheckout: Boolean!
    instances: [ToolItemInstance]
    imageUrl: String
  }

  type ToolItemInstance {
    id: ID
    type: ToolItemType!
    uniqueIdentifier: String
    locationRoom: Room
    locationDescription: String
    condition: String!
    status: String!
    notes: String
    borrower: User
    borrowedAt: String
  }

  input ToolItemTypeInput {
    name: String!
    defaultLocationRoomID: ID
    defaultLocationDescription: String
    description: String
    checkoutNote: String
    checkinNote: String
    allowCheckout: Boolean!
    imageUrl: String
  }

  input ToolItemInstanceInput {
    typeID: ID!
    uniqueIdentifier: String!
    locationRoomID: ID
    locationDescription: String
    condition: String!
    status: String!
    notes: String
  }

  extend type Query {
    toolItemTypes: [ToolItemType]
    toolItemTypesAllowCheckout: [ToolItemType]
    toolItemType(id: ID!): ToolItemType
    toolItemInstances: [ToolItemInstance]
    toolItemInstancesByType(id: ID!): [ToolItemInstance]
    toolItemInstance(id: ID!): ToolItemInstance
    toolItemInstancesByBorrower(id: ID!): [ToolItemInstance]
  }

  extend type Mutation {
    createToolItemType(toolItemType: ToolItemTypeInput): ToolItemType
    updateToolItemType(id: ID!, toolItemType: ToolItemTypeInput): ToolItemType
    createToolItemInstance(toolItemInstance: ToolItemInstanceInput): ToolItemInstance
    updateToolItemInstance(id: ID!, toolItemInstance: ToolItemInstanceInput): ToolItemInstance
    borrowInstance(userID: ID!, instanceID: ID!): Boolean
    returnInstance(instanceID: ID!): Boolean
    deleteToolItemType(id: ID!): Boolean
    returnToolItemInstance(id: ID!): Boolean
    deleteToolItemInstance(id: ID!): Boolean
  }
`;