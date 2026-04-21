import { gql } from "graphql-tag";

export const ThemeTypeDefs = gql`

  type Theme {
    key: String!
    themeName: String!
    title: String!
    muiThemeOptions: String!
    logo: String!
  }

  extend type Query {
    getThemes: [Theme]
  }

  extend type Mutation {
    createTheme(themeName: String!, title: String!, muiThemeOptions: String!, logo: String!): Theme
  }
`;