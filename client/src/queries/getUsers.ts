import { gql } from "@apollo/client";

export interface PartialUser {
  id: number;
  ritUsername: string;
  firstName: string;
  lastName: string;
  setupComplete?: boolean;
  activeHold: boolean;
  restrictions: any[];
}

const GET_USERS = gql`
  query GetUsers($searchText: String) {
    users(searchText: $searchText) {
      id
      ritUsername
      firstName
      lastName
    }
  }
`;

export const GET_USERS_LIMIT = gql`
  query GetUsers($searchText: String) {
    usersLimit(searchText: $searchText) {
      id
      ritUsername
      firstName
      lastName
      activeHold
      admin
      manager
      staff
      trainer
      restrictions {
        id
      }
    }
  }
`;

export const GET_NUM_USERS = gql`
  query NumUsers {
    numUsers {
      count
    }
  }
`;

export const GET_USER_BY_USERNAME_OR_UID = gql`
  query GetUserByUsernameOrUID($value: String) {
    userByUsernameorUID(value: $value) {
      id
      firstName
      lastName
      activeHold
    }
  }
`;

export default GET_USERS;
