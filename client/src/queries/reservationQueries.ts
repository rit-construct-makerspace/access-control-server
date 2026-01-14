import { gql } from "@apollo/client";

export const GET_RESERVATION_BY_ID = gql`
  query Reservation($id: Int!) {
    reservation(id: $id) {
      id
      user {
        id
        firstName
        lastName
      }
      equipment {
        id
        name
      }
      start
      end
      description
      approved
    }
  }
`;

export const GET_RESERVATIONS_FLEXIBLY = gql`
  query Reservations($range: Range, $equipmentIDs: [Int!]) {
    reservations(range: $range, equipmentIDs: $equipmentIDs) {
      id
      user {
        id
        firstName
        lastName
      }
      equipment {
        id
        name
      }
      start
      end
      description
      approved
    }
  }
`

export const CREATE_RESERVATION = gql`
  mutation CreateReservation($userID: Int!, $equipmentID: Int!, $start: String!, $end: String!, $description: String) {
    createReservation(userID: $userID, equipmentID: $equipmentID, start: $start, end: $end, description: $description) {
      id
    }
  }
`;