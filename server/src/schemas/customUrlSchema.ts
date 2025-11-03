import { gql } from "graphql-tag";

export interface CustomUrlInput {
  shortUrl: string
  longUrl: string
}

export const CustomUrlTypeDef = gql`
  type CustomUrl {
    id: ID!
    shortUrl: String
    longUrl: String
  }

  input CustomUrlInput {
    shortUrl: String
    longUrl: String
  }

  extend type Query{
    url(shortUrl: String!): CustomUrl
    urls: [CustomUrl]
    urlById(id: ID!): CustomUrl
  }

  extend type Mutation{
    createUrl(shortUrl: String, longUrl: String): CustomUrl
    updateUrl(id: ID!, newUrl: CustomUrlInput): CustomUrl
    deleteUrl(id: ID!): CustomUrl
  }
`;