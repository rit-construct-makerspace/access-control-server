import { gql } from "graphql-tag";

export const ChargeTypeDefs = gql`
    type UserInfoForCharge {
        user: User!,
        tigerBucksCents: Int!
        creditsCents: Int!
    }
    extend type Query {
        userDataFromUniversityIDCardTap(uid: String!): UserInfoForCharge
    }

    extend type Mutation {
        chargeUser(uid: String!, description: String!, amountCents: Int!): Boolean
    }
`;