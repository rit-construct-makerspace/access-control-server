import { gql } from "graphql-tag";

export const RestrictionTypeDefs = gql`
    type Restriction {
        id: ID!
        creator: User
        user: User!
        makerspace: Makerspace!
        reason: String!
        createDate: DateTime!
    }

    extend type Mutation {
        createRestriction(targetID: ID!, makerspaceID: ID!, reason: String!): Restriction
        deleteRestriction(id: ID!): Boolean
    }
`;