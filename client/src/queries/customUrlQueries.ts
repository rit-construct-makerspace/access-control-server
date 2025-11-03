import gql from "graphql-tag";

export const GET_ALL_CUSTOM_URLS = gql`
    query GetUrls{
      urls{
        id
        shortUrl
        longUrl
      }
    }
`;

export const CREATE_CUSTOM_URL = gql`
  mutation CreateCustomUrl($shortUrl: String!, $longUrl: String!) {
    createUrl(shortUrl: $shortUrl, longUrl: $longUrl) {
      id
    }
  }
`;

export const UPDATE_CUSTOM_URL = gql`
  mutation UpdateCustomUrl($id: ID!, $shortUrl: String, $longUrl: String){
    updateUrl(
      id: $id
      newUrl: {shortUrl: $shortUrl, longUrl: $longUrl}
    ) {
      id  
    }
  }
`

export const DELETE_CUSTOM_URL = gql`
  mutation DeleteCustomUrl($id: ID!){
    deleteUrl(id: $id){
      id
    }
  }
`