/**
 * usersSchema.ts
 * GraphQL declarations for Users
 */

import { gql } from "graphql-tag";
import { UserRow } from "../../database/knex/tables.js";

export interface PassedModule {
  moduleID: number;
  moduleName: string;
  passedDate: Date;
  makerspaceID: number;
}

export interface User extends UserRow {
  passedModules?: PassedModule[];
}

export const UsersTypeDefs = gql`
  type PassedModule {
    moduleID: ID!
    moduleName: String!
    passedDate: DateTime!
    makerspaceID: ID
  }

  type User {
    id: ID!
    firstName: String!
    lastName: String!
    pronouns: String
    isStudent: Boolean!
    registrationDate: DateTime!
    admin: Boolean!
    holds: [Hold]
    passedModules: [PassedModule]
    accessChecks: [AccessCheck]
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
    currencyAccount: CurrencyAccount!

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
    archived: Boolean!
    forceArchive: Boolean
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

  type Count {
    count: Int
  }

  extend type Query {
    users(searchText: String): [User]
    usersLimit(searchText: String): [User]
    user(id: ID!): User
    currentUser: User
    isUserWelcomed(userID: ID!, roomID: ID!): Boolean
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

    forceArchiveUser(userID: ID!, force: Boolean): User
  }
`;
