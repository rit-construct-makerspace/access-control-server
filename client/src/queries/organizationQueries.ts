import { gql } from "@apollo/client";

export const GET_ORG_BY_ID = gql`
  query GetOrganizationByID($id: ID!) {
    getOrganizationByID(id: $id) {
      id
      username
      notes
      displayname      
      accountID
      account {
        id
        balance
      }
    }
  }
`;

export const SEARCH_ORGS_LIMIT = gql`
  query SearchOrganizationsLimit($searchText: String!) {
    searchOrganizationsLimit(searchText: $searchText) {
      id
      username
      notes
      displayname
      accountID
      account {
        id
        balance
      }
    }
  }
`;

export const CREATE_ORG = gql`
  mutation CreateOrganization($username: String!, $displayname: String, $notes: String) {
    createOrganization(username: $username, displayname: $displayname, notes: $notes) {
      id
    }
  }
`;

export const EDIT_ORG_NOTES = gql`
  mutation EditOrganizationNotes($orgID: ID!, $notes: String!) {
    editOrganizationNotes(orgID: $orgID, notes: $notes) {
      id 
      notes
    }
  }
`;

export const DELETE_ORG = gql`
  mutation DeleteOrganization($orgID: ID!) {
    deleteOrganization(orgID: $orgID)
  }
`;

