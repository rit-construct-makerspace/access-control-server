import { gql } from "@apollo/client";

export const GET_CARTS = gql`
  query GetCarts($makerspaceID: ID) {
    carts(makerspaceID: $makerspaceID) {
      id
      user {
        id
        name
      }
      makerspace {
        id
        name
      }
    }
  }
`;

export const GET_CART = gql`
  query GetCart($id: ID!) {
    cart(id: $id) {
      id
      user {
        id
        name
      }
      makerspace {
        id
        name
      }
      items {
        id
        name
        quantity
      }
    }
  }
`;

export const SUBTRACT_ITEM_FROM_CART = gql`
  mutation SubtractItemFromCart($cartID: ID!, $itemID: ID!, $quantity: Int!) {
    subtractItemFromCart(cartID: $cartID, itemID: $itemID, quantity: $quantity)
  }
`;