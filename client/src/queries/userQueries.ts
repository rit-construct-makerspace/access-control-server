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

export interface AccessCheck {
  id: string;
  equipmentID: string;
  approved: boolean;
}

export interface AccessCheckExtraInfo {
  id: number;
  approved: boolean;
  equipment: {
    id: number;
    name: string;
    requiresTrainerApproval: boolean;
    room: {
      makerspace: {
        id: number;
      }
    }
  }
}

export interface Hold {
  id: string;
  description: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  remover?: {
    firstName: string;
    lastName: string;
  };
  createDate: string;
  removeDate?: string;
}

export interface Restriction {
  id: number;
  reason: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  makerspace: {
    id: number;
    name: string;
  };
  createDate: string;
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

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      firstName
      lastName
      pronouns      
      college
      expectedGraduation
      registrationDate
      ritUsername
      cardTagID
      notes
      archived
      forceArchive
      holds {
        id
        creator {
          firstName
          lastName
        }
        remover {
          firstName
          lastName
        }
        createDate
        removeDate
        description
      }
      restrictions {
        id
        creator {
          firstName
          lastName
        }
        makerspace {
          id
          name
        }
        reason
        createDate
      }
      accessChecks {
        id
        equipment {
          id
          name
          requiresTrainerApproval
          room {
            makerspace {
              id
            }
          }
        }
        approved
      }
      passedModules {
        moduleID
        moduleName
        passedDate
        makerspaceID
      }
      trainingHolds {
        id
        module {
          id
          name
        }
        expires
      }
      admin
      manager
      staff
      trainer
    }
  }
`;

export const UPDATE_STUDENT_PROFILE = gql`
  mutation UpdateStudentProfile(
    $userID: ID!
    $pronouns: String
    $college: String
    $expectedGraduation: String
  ) {
    updateStudentProfile(
      userID: $userID
      pronouns: $pronouns
      college: $college
      expectedGraduation: $expectedGraduation
    ) {
      id
    }
  }
`;


export default GET_USERS;
