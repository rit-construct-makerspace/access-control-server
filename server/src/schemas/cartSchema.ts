import { gql } from "graphql-tag";

export const CartTypeDefs = gql`
  type Cart {
    id: ID!
    user: User!
    makerspace: Zone!
    items: [InventoryItem!]!
  }

  extend type Query {
    cart(id: ID!): Cart
    carts(makerspaceID: ID): [Cart!]!
  }

  extend type Mutation {
    subtractItemFromCart(cartID: ID!, itemID: ID!, quantity: Int!): Boolean!
  }
`;