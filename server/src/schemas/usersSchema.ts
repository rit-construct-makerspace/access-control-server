/**
 * usersSchema.ts
 * GraphQL declarations for Users
 */

import { gql } from "graphql-tag";
import { UserRow } from "../db/tables.js";

export enum Privilege {
  MAKER = "MAKER",    // Maker
  MENTOR = "MENTOR",  // Mentor
  STAFF = "STAFF",    // Staff
}

export interface PassedModule {
  id: number;
  moduleID: number;
  moduleName: string;
  submissionDate: Date;
  expirationDate: Date;
}

export interface User extends UserRow {
  passedModules?: PassedModule[];
}

export const UsersTypeDefs = gql`
  enum Privilege {
    MAKER
    MENTOR
    STAFF
  }

  type PassedModule {
    id: ID!
    moduleID: ID!
    moduleName: String!
    submissionDate: DateTime!
    expirationDate: DateTime!
  }

  type UserAccessCheck {
    id: ID!
    equipmentID: ID!
    approved: Boolean!
  }

  type User {
    id: ID!
    firstName: String!
    lastName: String!
    pronouns: String
    balance: String!
    isStudent: Boolean!
    privilege: Privilege!
    registrationDate: DateTime!
    admin: Boolean!
    holds: [Hold]
    passedModules: [PassedModule]
    accessChecks: [UserAccessCheck]
    expectedGraduation: String
    college: String
    cardTagID: String
    room: Room
    roomMonitoring: Room
    notes: String
    activeHold: Boolean
    trainingHolds: [TrainingHold]
    manager: [Int]
    staff: [Int]
    trainer: [Int]
    restrictions: [Restriction]

    """
    The number-letter combination that is attached to your RIT email
    (ie. abc1234). Not sensitive info. Stored plainly.
    Not to be confused with the universityID.
    """
    ritUsername: String!

    """
    Has the user completed the signup form?
    """
    setupComplete: Boolean

    """
    Is the user's account suspended/archived?
    """
    isArchived: Boolean
  }

  input StudentUserInput {
    ritUsername: String!
    firstName: String!
    lastName: String!
    expectedGraduation: String!
    college: String!
    major: String!
  }

  input FacultyUserInput {
    firstName: String!
    lastName: String!
  }

  input Count {
    count: Int
  }

  extend type Query {
    users(searchText: String): [User]
    usersLimit(searchText: String): [User]
    user(id: ID!): User
    currentUser: User
    numUsers: Count
    userByUsernameorUID(value: String): User
  }

  extend type Mutation {
    createUser(
      firstName: String
      lastName: String
      ritUsername: String
    ): User

    updateStudentProfile(
      userID: ID!
      pronouns: String
      college: String
      expectedGraduation: String
    ): User

    setPrivilege(userID: ID!, privilege: Privilege): User

    archiveUser(userID: ID!): User

    setCardTagID(
      userID: ID!
      cardTagID: String
    ): User

    setNotes(
      userID: ID!
      notes: String!
    ): User

    setUserAdmin(userID: ID!, admin: Boolean): Boolean

    makeUserManager(userID: ID!, makerspaceID: ID!): [Int]
    makeUserStaff(userID: ID!, makerspaceID: ID!): [Int]
    makeUserTrainer(userID: ID!, equipmentID: ID!): [Int]

    revokeUserManager(userID: ID!, makerspaceID: ID!): [Int]
    revokeUserStaff(userID: ID!, makerspaceID: ID!): [Int]
    revokeUserTrainer(userID: ID!, equipmentID: ID!): [Int]
  }
`;
