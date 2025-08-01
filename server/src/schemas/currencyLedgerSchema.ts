import { gql } from "graphql-tag";

export const CurrencyLedgerTypeDefs = gql`
  type CurrencyLedgerEntry {
    id: ID!
    dateTime: DateTime!
    accountID: ID!
    amount: Int!
    source: String!
    description: String
    atxID: Int
    refID: Int
  }

  extend type Query {
    currencyLedgerEntriesLimit(searchText: String): [CurrencyLedgerEntry]
  }
`;