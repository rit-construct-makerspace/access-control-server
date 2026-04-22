import { gql } from "graphql-tag";

export const ThemeTypeDefs = gql`

  type Theme {
    key: String!
    themeName: String!
    title: String!
    muiThemeOptions: String!
    logo: String!
    default: Boolean!
  }

  extend type Query {
    getThemes: [Theme]
    getTheme(key: String!): Theme
  }

  extend type Mutation {
    createTheme(themeName: String!, title: String!, muiThemeOptions: String!, logo: String!): Theme
    updateTheme(key: String!, themeName: String!, title: String!, muiThemeOptions: String!, logo: String!): Theme
    markDefaultTheme(key: String!): Boolean!
  }
`;