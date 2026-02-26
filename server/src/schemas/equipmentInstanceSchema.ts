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
        reader: Reader
        accessController: AccessController
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
    }

    extend type Mutation {
        createEquipmentinstance(equipmentID: ID!, name: String!): EquipmentInstance
        setInstanceStatus(id: ID!, status: String!): EquipmentInstance
        setInstanceName(id: ID!, name: String!): EquipmentInstance
        deleteInstance(id: ID!): Boolean
        assignReaderToEquipmentInstance(instanceId: ID!, readerId: ID): EquipmentInstance
        updateInstance(id: ID!, name: String!, status: String!, readerID: ID): EquipmentInstance
    }
`