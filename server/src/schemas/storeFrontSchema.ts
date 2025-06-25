/**
 * storeFrontSchema.ts
 * GraphQL declarations for InventoryItems, InventoryLedgers, and InventoryTags
 */

import { gql } from "graphql-tag";

export interface InventoryItem {
  id: number;
  image: string;
  name: string;
  unit: string;
  pluralUnit: string;
  count: number;
  pricePerUnit: number;
  threshold: number;
  staffOnly: boolean;
  storefrontVisible: boolean;
  notes: string;
  tagID1: number | null;
  tagID2: number | null;
  tagID3: number | null;
}

export interface InventoryItemInput {
  image: string;
  name: string;
  labels: string[];
  unit: string;
  pluralUnit: string;
  count: number;
  pricePerUnit: number;
  threshold: number;
  notes: string;
}

export const StoreFrontTypeDefs = gql`
  scalar DateTime

  type InventoryItem {
    id: ID!
    image: String
    name: String
    labels: [String]
    unit: String
    pluralUnit: String
    count: Int
    pricePerUnit: Float
    threshold: Int
    staffOnly: Boolean
    storefrontVisible: Boolean
    notes: String
    tags: [InventoryTag]
    makerspace: Zone
    makerspaceID: ID!
  }

  type InventoryTag {
    id: ID!
    label: String!
    color: String
  }

  input InventoryItemInput {
    image: String
    name: String
    labels: [String]
    unit: String
    pluralUnit: String
    count: Int
    pricePerUnit: Float
    threshold: Int
    staffOnly: Boolean
    storefrontVisible: Boolean
    notes: String
  }

  input CartItem {
    id: ID!
    count: Int!
  }

  type InventoryLedger {
    id: ID!
    timestamp: String!
    initiator: User!
    category: String!
    totalCost: Float!
    purchaser: User
    notes: String
    items: [LedgerItem]
  }

  type LedgerItem {
    quantity: Int!
    name: String!
  }

  type User {
    id: ID
    firstName: String
    lastName: String
  }

  extend type Query {
    InventoryItems(storefrontVisible: Boolean): [InventoryItem]
    InventoryItem(id: ID!): InventoryItem
    Labels: [String]
    Ledgers(startDate: DateTime, stopDate: DateTime, searchText: String): [InventoryLedger]
    inventoryTags: [InventoryTag]
  }

  extend type Mutation {
    archiveInventoryItem(itemId: ID!): InventoryItem
    createInventoryItem(item: InventoryItemInput): InventoryItem
    updateInventoryItem(itemId: ID!, item: InventoryItemInput): InventoryItem
    addItemAmount(itemId: ID!, count: Int!): InventoryItem
    removeItemAmount(itemId: ID!, count: Int!): InventoryItem
    createLabel(label: String): String
    archiveLabel(label: String): String
    deleteInventoryItem(id: ID!): Boolean
    checkoutItems(items: [CartItem], notes: String, recievingUserID: ID): Boolean
    setStaffOnly(id: ID!, staffOnly: Boolean!): InventoryItem
    setStorefrontVisible(id: ID!, storefrontVisible: Boolean!): InventoryItem
    addTagToItem(itemID: ID!, tagID: ID!): Boolean
    removeTagFromItem(itemID: ID!, tagID: ID!): Boolean
    deleteLedger(id: ID!): Boolean
    createTag(label: String!, color: String!): Boolean
    updateTag(id: ID!, label: String!, color: String!): Boolean
    deleteTag(id: ID!): Boolean
  }
`;
