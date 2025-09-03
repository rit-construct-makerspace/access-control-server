import { gql } from "graphql-tag";

export const CurrencyLedgerTypeDefs = gql`
  type CurrencyLedgerEntry {
    id: ID!
    dateTime: DateTime!
    accountID: ID
    owner: String!
    transactionEntryId: ID
    currencyType: String
    amount: Int!
    description: String
    atxID: Int
    refID: Int
  }

  extend type Query {
    currencyLedgerEntriesLimit(searchText: String): [CurrencyLedgerEntry]
  }
`;