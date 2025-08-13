import { gql } from "@apollo/client";

export const GET_CARTS = gql`
  query GetCarts($makerspaceID: ID) {
    carts(makerspaceID: $makerspaceID) {
      id
      user {
        id
        firstName
        lastName
        ritUsername
      }
      makerspace {
        id
        name
      }
      lastModified
    }
  }
`;

export const GET_CART = gql`
  query GetCart($id: ID!) {
    cart(id: $id) {
      id
      user {
        id
        firstName
        lastName
        ritUsername
      }
      makerspace {
        id
        name
      }
      items {
        id
        image
        name
        unit
        pluralUnit
        count
        pricePerUnit
        notes
        cartcount
      }
      lastModified
    }
  }
`;

export const SUBTRACT_ITEM_FROM_CART = gql`
  mutation SubtractItemFromCart($cartID: ID!, $itemID: ID!, $quantity: Int!, $restock: Boolean!) {
    subtractItemFromCart(cartID: $cartID, itemID: $itemID, quantity: $quantity, restock: $restock)
  }
`;

export const CANCEL_CART = gql`
  mutation CancelCart($cartID: ID!) {
    cancelCart(cartID: $cartID)
  }
`;

export const COMPLETE_CART = gql`
  mutation CompleteCart($cartID: ID!) {
    completeCart(cartID: $cartID)
  }
`;
