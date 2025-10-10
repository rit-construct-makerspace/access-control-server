import { gql } from "@apollo/client";

const GET_ROOMS = gql`
  query GetRooms {
    rooms {
      id
      name
    }
  }
`;

export const CREATE_ROOM = gql`
  mutation CreateRoom($name: String!, $makerspaceID: ID!) {
    addRoom(room: { name: $name, makerspaceID: $makerspaceID }) {
      id
    }
  }
`;

export const ARCHIVE_ROOM = gql`
  mutation ArchiveRoom($id: ID!) {
    archiveRoom(roomID: $id) {
      id
    }
  }
`;

export const UNARCHIVE_ROOM = gql`
  mutation UnarchiveRoom($id: ID!) {
    unarchiveRoom(roomID: $id) {
      id
    }
  }
`;

export const DELETE_ROOM = gql`
  mutation DeleteRoom($id: ID!) {
    deleteRoom(roomID: $id) {
      id
    }
  }
`;

export const UPDATE_ROOM_NAME = gql`
  mutation UpdateRoomName($id: ID!, $name: String) {
    updateRoomName(roomID: $id, name: $name) {
      id
    }
  }
`;

export default GET_ROOMS;
