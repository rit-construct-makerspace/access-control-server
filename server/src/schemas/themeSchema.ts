import { gql } from "graphql-tag";

export const TermsTypeDefs = gql`

  type Theme {
    key: String!
    themeName: String!
    title: String!
    muiThemeOptions: String!
    icon: String!
  }

  extend type Query {
    getThemes: [Theme]
  }

  extend type Mutation {
    createTheme(themeName: String!, title: String!, muiThemeOptions: String!, icon: String!): Theme
  }
`;