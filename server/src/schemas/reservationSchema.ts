import { gql } from "graphql-tag";

export const ReservationTypeDefs = gql`
  type Reservation {
    id: Int!,
    userID: Int!,
    equipmentID: Int!,
    start: String!,
    end: String!,
    description: String,
    equipment: Equipment!,
    user: User!
  }

  input Range {
    start: String
    end: String
  }

  extend type Query {
    reservation(id: Int!): [Reservation]
    reservations(range: Range, equipmentIDs: [Int!]): [Reservation]
  }

  extend type Mutation {
    createReservation(userID: Int!, equipmentID: Int!, start: String!, end: String!, description: String): [Reservation]
    setReservationApproval(id: Int!, approve: Boolean!): [Reservation]
    deleteReservation(id: Int!): Int
  }
`;