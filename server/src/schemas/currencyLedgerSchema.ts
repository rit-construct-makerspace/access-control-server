import { gql } from "graphql-tag";

export const CurrencyLedgerTypeDefs = gql`
  type CurrencyLedgerEntry {
    id: ID!
    dateTime: DateTime!
    accountID: ID
    owner: String!
    creditAmount: Int!
    atriumAmount: Int!
    source: String!
    description: String
    atxID: Int
    refID: Int
    printerJobId: ID
    atriumTerminal: String
  }

  extend type Query {
    currencyLedgerEntriesLimit(searchText: String): [CurrencyLedgerEntry]
  }
`;