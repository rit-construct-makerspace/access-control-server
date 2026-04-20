import gql from "graphql-tag";

export const GET_THEMES = gql`
  query GetThemes {
    getThemes {
      key
      themeName
      title
      muiThemeOptions
      icon
    }
  }
`;