import { gql } from "@apollo/client";

export const GET_TOOL_ITEM_TYPES_WITH_INSTANCES = gql`
  query GetToolItemTypesWithInstances {
    toolItemTypes {
      id
      name
      defaultLocationRoom {
        id
        name
      }
      defaultLocationDescription
      description
      checkoutNote
      checkinNote
      allowCheckout
      instances {
        id
        type {
          id
          name
        }
        uniqueIdentifier
        locationRoom {
          id
          name
        }
        locationDescription
        condition
        status
        notes
        borrower {
          id
          firstName
          lastName
        }
        borrowedAt
      }
      imageUrl
    }
  }
`;

export const GET_TOOL_ITEM_TYPES = gql`
  query GetToolItemTypes {
    toolItemTypes {
      id
      name
      defaultLocationRoom {
        id
        name
      }
      defaultLocationDescription
      description
      checkoutNote
      checkinNote
      allowCheckout
    }
  }
`;

export const GET_TOOL_ITEM_INSTANCES_BY_TYPE = gql`
  query GetToolItemInstancesByType($id: ID!) {
    toolItemInstancesByType(id: $id) {
      id
      type {
        id
        name
      }
      uniqueIdentifier
      locationRoom {
        id
        name
      }
      locationDescription
      condition
      status
      notes
      borrower {
        id
        firstName
        lastName
      }
      borrowedAt
    }
  }
`;

export const GET_TOOL_ITEM_INSTANCE = gql`
  query GetToolItemInstance($id: ID!) {
    toolItemInstance(id: $id) {
      id
      type {
        id
        name
      }
      uniqueIdentifier
      locationRoom {
        id
        name
      }
      locationDescription
      condition
      status
      notes
      borrower {
        id
        firstName
        lastName
      }
      borrowedAt
    }
  }
`;

export const GET_TOOL_ITEM_INSTANCES_BY_BORROWER = gql`
  query GetToolItemInstancesByBorrower($id: ID!) {
    toolItemInstancesByBorrower(id: $id) {
      id
      type {
        id
        name
        defaultLocationRoom {
          id
          name
        }
        defaultLocationDescription
        description
        checkoutNote
        checkinNote
        allowCheckout
      }
      uniqueIdentifier
      locationRoom {
        id
        name
      }
      locationDescription
      condition
      status
      notes
      borrower {
        id
        firstName
        lastName
      }
      borrowedAt
    }
  }
`;

export const CREATE_TOOL_ITEM_TYPE = gql`
  mutation CreateToolItemType($toolItemType: ToolItemTypeInput!) {
    createToolItemType(toolItemType: $toolItemType) {
      id
    }
  }
`;

export const UPDATE_TOOL_ITEM_TYPE = gql`
  mutation UpdateToolItemType($id: ID!, $toolItemType: ToolItemTypeInput!) {
    updateToolItemType(id: $id, toolItemType: $toolItemType) {
      id
    }
  }
`;

export const CREATE_TOOL_ITEM_INSTANCE = gql`
  mutation CreateToolItemInstance($toolItemInstance: ToolItemInstanceInput!) {
    createToolItemInstance(toolItemInstance: $toolItemInstance) {
      id
    }
  }
`;

export const UPDATE_TOOL_ITEM_INSTANCE = gql`
  mutation UpdateToolItemInstance($id: ID!, $toolItemInstance: ToolItemInstanceInput!) {
    updateToolItemInstance(id: $id, toolItemInstance: $toolItemInstance) {
      id
    }
  }
`;

export const BORROW_INSTANCE = gql`
  mutation BorrowInstance($userID: ID!, $instanceID: ID!) {
    borrowInstance(userID: $userID, instanceID: $instanceID)
  }
`;

export const RETURN_INSTANCE = gql`
  mutation ReturnInstance($instanceID: ID!) {
    returnInstance(instanceID: $instanceID)
  }
`;

export const DELETE_TYPE = gql`
  mutation DeleteToolItemType($id: ID!) {
    deleteToolItemType(id: $id)
  }
`;

export const DELETE_INSTANCE = gql`
  mutation DeleteToolItemInstance($id: ID!) {
    deleteToolItemInstance(id: $id)
  }
`;