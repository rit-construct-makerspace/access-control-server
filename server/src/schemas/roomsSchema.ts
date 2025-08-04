/**
 * roomsSchema.ts
 * GraphQL declarations for Rooms
 */

import { gql } from "graphql-tag";

export interface Swipe {
  id: number;
  dateTime: Date;
  roomID: number;
  userID: number;
}

export const RoomTypeDefs = gql`
  type Swipe {
    id: ID!
    dateTime: DateTime
    user: User
  }

  type Room {
    id: ID!
    name: String!
    zone: Zone
    equipment: [Equipment]
    recentSwipes: [Swipe]
    mentors: [User]
    trainingModules: [TrainingModule]
  }

  input RoomInput {
    name: String!
    zoneID: ID!
  }

  extend type Query {
    rooms: [Room]
    room(id: ID!): Room
  }

  extend type Mutation {
    addRoom(room: RoomInput): Room
    archiveRoom(roomID: ID!): Room
    deleteRoom(roomID: ID!): Room

    updateRoomName(roomID: ID!, name: String): Room
    setZone(roomID: ID!, zoneID: ID!): Room

    swipeIntoRoomWithID(roomID: ID!, id: ID!): User

    addTrainingToRoom(roomID: ID!, moduleID: ID!): [TrainingModule]
    removeTrainingFromRoom(roomID: ID!, moduleID: ID!): [TrainingModule]
  }
`;
