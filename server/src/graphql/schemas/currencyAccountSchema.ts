import { gql } from "graphql-tag";

export const CurrencyAccountsTypeDefs = gql`
    type CurrencyAccount {
        id: ID!
        balance: Int!
        owner: CurrencyAccountOwner!
    }

    type CurrencyAccountOwner {
        displayName: String!
        username: String!
        userID: ID
        orgID: ID
    }

    extend type Query {
        currencyAccount(accountID: ID!): CurrencyAccount
        currencyAccountsLimit(searchText: String): [CurrencyAccount]
    }

    extend type Mutation {
        adjustAccountBalanceCents(accountID: ID!, amount: Int!, description: String!): Boolean
    }
`;