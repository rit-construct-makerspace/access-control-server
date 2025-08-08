import { gql } from "graphql-tag";


export const OrganizationTypeDefs = gql`
  type Organization {
    id: ID!
    username: String!
    displayname: String
    accountID: ID!
    account: CurrencyAccount!
  }

  extend type Query {
    searchOrganizationsLimit(searchText: String): [Organization]
  }

  extend type Mutation {
    createOrganization(username: String!, displayname: String): Organization
    deleteOrganization(orgID: ID!): Boolean
  }
`;