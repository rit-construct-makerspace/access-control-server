import gql from "graphql-tag";

export const GET_THEMES = gql`
  query GetThemes {
    getThemes {
      key
      themeName
      title
      muiThemeOptions
      logo
      default
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
      default
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

export const MARK_DEFAULT_THEME = gql`
  mutation MarkDefaultTheme($key: String!) {
    markDefaultTheme(key: $key)
  }
`;
export const DELETE_THEME = gql`
  mutation DeleteTheme($key: String!) {
    deleteTheme(key: $key)
  }
`;