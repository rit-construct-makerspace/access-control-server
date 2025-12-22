import { gql } from "@apollo/client";

export interface Announcement {
  id: string;
  title: string;
  description: string;
  linkText: string;
  linkUrl: string;
}

export const GET_ANNOUNCEMENTS = gql`
  query GetAnnouncements {
    getAllAnnouncements {
      id
      title
      description
      linkText
      linkUrl
    }
  }
`;

export const CREATE_ANNOUNCEMENT = gql`
mutation CreateAnnouncement($title: String!, $description: String!, $linkText: String, $linkUrl: String) {
  createAnnouncement(title: $title, description: $description, linkText: $linkText, linkUrl: $linkUrl) {
    id
    title
    description
    linkText
    linkUrl
  }
}
`;

export const GET_ANNOUNCEMENT = gql`
  query GetAnnouncementByID($id: ID!) {
    getAnnouncement(id: $id) {
      id
      title
      description
      linkText
      linkUrl
    }
  }
`;

export const UPDATE_ANNOUNCEMENT = gql`
  mutation UpdateAnnouncement($id: ID!, $title: String!, $description: String!, $linkText: String, $linkUrl: String) {
    updateAnnouncement(id: $id, title: $title, description: $description, linkText: $linkText, linkUrl: $linkUrl) {
      id
      title
      description
      linkText
      linkUrl
    }
  }
`;

export const DELETE_ANNOUNCEMENT = gql`
  mutation DeleteAnnouncement($id: ID!) {
    deleteAnnouncement(id: $id)
  }
`;