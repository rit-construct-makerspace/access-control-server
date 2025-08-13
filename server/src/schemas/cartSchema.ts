import { gql } from "graphql-tag";

export const CartTypeDefs = gql`
  type InventoryCart {
    id: ID!
    user: User!
    makerspace: Zone!
    items: [PurchasedItem!]!
    lastModified: DateTime
  }

  type PurchasedItem {
    id: ID!
    image: String
    name: String
    unit: String
    pluralUnit: String
    count: Int
    pricePerUnit: Float
    notes: String
    cartcount: Int!
  }

  extend type Query {
    cart(id: ID!): InventoryCart
    carts(makerspaceID: ID): [InventoryCart!]!
  }

  extend type Mutation {
    subtractItemFromCart(cartID: ID!, itemID: ID!, quantity: Int!, restock: Boolean): Boolean!
    cancelCart(cartID: ID!): Boolean!
    completeCart(cartID: ID!): Boolean!
  }
`;