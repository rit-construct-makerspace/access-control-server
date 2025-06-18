/**
 * statisticQuerySchema.ts
 * GraphQL declarations for various statistical queries
 */

import { gql } from "graphql-tag";

export const StatisticQueryTypeDefs = gql`
    type RoomSwipeStats {
        day: String
        roomID: ID
        data: [HourStats]
    }

    type HourStats {
        hour: String!
        sum: Float
        avg: Float
    }

    type Count {
        count: Int
    }

    type ModuleStats {
        moduleID: ID!
        moduleName: String!
        passedSum: Int
        failedSum: Int
    }

    type VerboseEquipmentSession {
        id: ID!
        start: DateTime!
        equipmentID: ID!
        userID: ID!
        userName: String!
        sessionLength: Int!
        readerSlug: String!
        equipmentName: String!
        roomID: ID!
        roomName: String!
        zoneID: ID!
        zoneName: String!
    }

    type VerboseRoomSwipe {
        id: ID!
        dateTime: DateTime!
        roomID: ID!
        roomName: String!
        userID: ID!
        userName: String!
    }

    type VerboseTrainingSubmission {
        id: ID!
        moduleID: ID!
        moduleName: String!
        quiz: JSON!
        makerID: ID!
        makerName: String!
        summary: JSON!
        submissionDate: DateTime!
        passed: Boolean!
        expirationDate: DateTime!
    }

    extend type Query {
        numNewUsersToday: Int
        numRoomSwipesToday: Int
        numEquipmentSessionsToday: Int
        getEquipmentSessionsWithAttachedEntities(startDate: String, endDate: String, equipmentIDs: [String]): [VerboseEquipmentSession]
        getRoomSwipesWithAttachedEntities(startDate: String, endDate: String, roomIDs: [String]): [VerboseRoomSwipe]
        getTrainingSubmissionsWithAttachedEntities(startDate: String, endDate: String, moduleIDs: [String]): [VerboseTrainingSubmission]
    }
`;