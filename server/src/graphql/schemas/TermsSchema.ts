/**
 * TermsSchema.ts
 * GraphQL declarations for Terms
 */

import { gql } from "graphql-tag";

export const TermsTypeDefs = gql`
    extend type Query {
        getTerms: String
    }

    extend type Mutation {
        setTerms(value: String): Int
    }
`;