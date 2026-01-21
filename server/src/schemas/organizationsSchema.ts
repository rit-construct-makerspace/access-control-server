import { gql } from "graphql-tag";


export const OrganizationTypeDefs = gql`
  type Organization {
    id: ID!
    username: String!
    displayname: String
    notes: String!
    accountID: ID!
    account: CurrencyAccount!
  }

  extend type Query {
    searchOrganizationsLimit(searchText: String): [Organization]
    getOrganizationByID(id: ID!): Organization
  }

  extend type Mutation {
    createOrganization(username: String!, displayname: String, notes: String): Organization
    editOrganizationNotes(orgID: ID!, notes: String!): Organization
    deleteOrganization(orgID: ID!): Boolean
  }
`;