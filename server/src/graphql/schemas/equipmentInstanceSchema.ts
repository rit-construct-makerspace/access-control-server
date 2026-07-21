/**
 * equipmentInstanceSchema.ts
 * GraphQL declarations for EquipmentInstances
 */

import { gql } from "graphql-tag";

export const EquipmentInstanceTypeDefs = gql`
    type EquipmentInstance {
        id: ID
        equipment: Equipment!
        name: String!
        status: String
        accessController: AccessController
        hobbsTime: Int!
    }
    type Reader {
        id: ID!
        name: String!
    }
    type Equipment {
        id: ID!
        name: String
    }


    extend type Query {
        equipmentInstances(equipmentID: ID!): [EquipmentInstance]
        getReaderPairedWithInstanceByInstanceId(instanceID: ID!): Reader
        getInstanceByID(id: ID!): EquipmentInstance
        getInstanceByControllerID(controllerID: Int!): EquipmentInstance
    }

    extend type Mutation {
        createEquipmentinstance(equipmentID: ID!, name: String!): EquipmentInstance
        setInstanceStatus(id: ID!, status: String!): EquipmentInstance
        setInstanceName(id: ID!, name: String!): EquipmentInstance
        deleteInstance(id: ID!): Boolean
        updateInstance(id: ID!, name: String!, status: String!): EquipmentInstance
        updateInstanceHobbsTime(id: ID!, hobbsTime: Int!): EquipmentInstance
        updateInstanceControllerAssignment(id: Int!, accessControllerID: Int): Boolean
    }
`