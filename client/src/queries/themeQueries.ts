import gql from "graphql-tag";

export const GET_THEMES = gql`
  query GetThemes {
    getThemes {
      key
      themeName
      title
      muiThemeOptions
      logo
    }
  }
`;

export const GET_THEME = gql`
  query GetTheme($key: String!) {
    getTheme(key: $key) {
      key
      themeName
      title
      muiThemeOptions
      logo
    }
  }
`;

export const CREATE_THEME = gql`
  mutation CreateTheme($themeName: String!, $title: String!, $muiThemeOptions: String!, $logo: String!) {
    createTheme(themeName: $themeName, title: $title, muiThemeOptions: $muiThemeOptions, logo: $logo) {
      key
    }
  }
`;

export const UPDATE_THEME = gql`
  mutation UpdateTheme($key: String!, $themeName: String!, $title: String!, $muiThemeOptions: String!, $logo: String!) {
    updateTheme(key: $key, themeName: $themeName, title: $title, muiThemeOptions: $muiThemeOptions, logo: $logo) {
      key
    }
  }
`;