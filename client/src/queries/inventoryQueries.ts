import { gql } from "@apollo/client";

export const GET_INVENTORY_ITEMS = gql`
  query getInventoryItems {
    InventoryItems {
      id
      name
      unit
      pluralUnit
      count
      pricePerUnit
      threshold
      staffOnly
      storefrontVisible
      notes
      tags {
        id
        label
        color
      }
    }
  }
`;

export const GET_INVENTORY_ITEM = gql`
  query GetInventoryItem($id: ID!) {
    InventoryItem(id: $id) {
      name
      unit
      pluralUnit
      pricePerUnit
      count
      threshold
      staffOnly
      storefrontVisible
      notes
      tags {
        id
        label
        color
      }
    }
  }
`;

export const GET_LEDGERS = gql`
  query GetLedgers(
    $startDate: DateTime
    $stopDate: DateTime
    $searchText: String
  ) {
    Ledgers(
      startDate: $startDate
      stopDate: $stopDate
      searchText: $searchText
    ) {
      id
      timestamp
      initiator {
        id
        firstName
        lastName
      }
      category
      totalCost
      purchaser {
        id
        firstName
        lastName
      }
      notes
      items {
        quantity
        name
      }
    }
  }
`;

export const UPDATE_INVENTORY_ITEM = gql`
  mutation UpdateInventoryItem($id: ID!, $item: InventoryItemInput) {
    updateInventoryItem(itemId: $id, item: $item) {
      id
    }
  }
`;

export const DELETE_INVENTORY_ITEM = gql`
  mutation DeleteInventorItem($id: ID!) {
    deleteInventoryItem(id: $id)
  }
`;

export const DELETE_INVENTORY_LEDGER = gql`
  mutation DeleteInventorLedger($id: ID!) {
    deleteLedger(id: $id)
  }
`;

export const CREATE_INVENTORY_ITEM = gql`
  mutation CreateInventoryItem($item: InventoryItemInput) {
    createInventoryItem(item: $item) {
      id
    }
  }
`;

export const SET_STAFF_ONLY = gql`
  mutation SetStaffOnly($id: ID!, $staffOnly: Boolean!) {
    setStaffOnly(id: $id, staffOnly: $staffOnly) {
      id
    }
  }
`;

export const SET_STOREFRONT_VISIBLE = gql`
  mutation SetStorefrontVisible($id: ID!, $storefrontVisible: Boolean!) {
    setStorefrontVisible(id: $id, storefrontVisible: $storefrontVisible) {
      id
    }
  }
`;

export const ADD_TAG_TO_ITEM = gql`
  mutation AddTagToItem($itemID: ID!, $tagID: ID!) {
    addTagToItem(itemID: $itemID, tagID: $tagID)
  }
`;

export const REMOVE_TAG_FROM_ITEM = gql`
  mutation RemoveTagFromItem($itemID: ID!, $tagID: ID!) {
    removeTagFromItem(itemID: $itemID, tagID: $tagID)
  }
`;

export const GET_INVENTORY_TAGS = gql`
  query InventoryTags {
    inventoryTags {
      id
      label
      color
    }
  }
`;

export const DELETE_INVENTORY_TAG = gql`
  mutation DeleteInventoryTag($id: ID!) {
    deleteTag(id: $id)
  }
`;

export const CREATE_INVENTORY_TAG = gql`
  mutation CreateInventoryTag($label: String!, $color: String!) {
    createTag(label: $label, color: $color)
  }
`;

export const UPDATE_INVENTORY_TAG = gql`
  mutation UpdateTag($id: ID!, $label: String!, $color: String!) {
    updateTag(id: $id, label: $label, color: $color)
  }
`;