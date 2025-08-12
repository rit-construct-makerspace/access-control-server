import { gql } from "@apollo/client";

export enum InstanceStatus {
  UNDEPLOYED = "UNDEPLOYED",
  ACTIVE = "ACTIVE",
  NEEDS_REPAIRS = "NEEDS REPAIRS",
  UNDER_REPAIRS = "UNDER REPAIRS",
  TESTING = "TESTING",
  RETIRED = "RETIRED"
}

export interface EquipmentInstance {
  id: number;
  equipment: {
    id: number;
    name: string;
  }
  name: string;
  status: InstanceStatus;
  reader: {
    id: number;
    name: string;
  } | null;
}

export const GET_EQUIPMENT_INSTANCES = gql`
  query EquipmentInstances($equipmentID: ID!) {
    equipmentInstances(equipmentID: $equipmentID) {
      id
      equipment {
        id
        name
      }
      name
      status
      reader {
        id
        name
      }
    }
  }
`;

export const GET_EQUIPMENT_INSTANCE_BY_ID = gql`
  query GetInstanceByID($id: ID!){
    getInstanceByID(id: $id){
      id
      equipment {
        id
        name
      }
      name
      status
      reader {
        id
        name
      }
    }
  }
`;

export const CREATE_EQUIPMENT_INSTANCE = gql`
    mutation CreateEquipmentinstance($equipmentID: ID!, $name: String!) {
        createEquipmentinstance(equipmentID: $equipmentID, name: $name) {
            id
        }
    }
`;

export const SET_INSTANCE_STATUS = gql`
    mutation SetInstanceStatus($id: ID!, $status: String!) {
        setInstanceStatus(id: $id, status: $status) {
            id
        }
    }
`;

export const SET_INSTANCE_NAME = gql`
    mutation SetInstanceName($id: ID!, $name: String!) {
        setInstanceName(id: $id, name: $name) {
            id
        }
    }
`;


export const UPDATE_INSTANCE = gql`
  mutation UpdateInstance($id: ID!, $name: String!, $status: String!, $readerID: ID) {
      updateInstance(id: $id, name: $name, status: $status, readerID: $readerID) {
          id
          equipment {
            id
            name
          }
          name
          status
          reader{
            id
            name
          }
      }
  }
`;


export const DELETE_EQUIPMENT_INSTANCE = gql`
    mutation DeleteInstance($id: ID!) {
        deleteInstance(id: $id)
    }
`;


export const ASSIGN_READER_TO_EQUIPMENT_INSTANCE = gql`
  mutation AssignReaderToEquipmentInstance($instanceId: ID!, $readerId: ID) {
    assignReaderToEquipmentInstance(instanceId: $instanceId, readerId: $readerId){
        id
    }
  }
`

export const GET_READER_PAIRED_WITH_INSTANCE_BY_INSTANCE_ID = gql`
    query GetReaderPairedWithInstanceByInstanceId($instanceID: ID!){
        getReaderPairedWithInstanceByInstanceId(instanceID: $instanceID){
      id
      name
      temp
      state
      user {
        id
        firstName
        lastName
      }
      recentSessionLength
      lastStatusReason
      scheduledStatusFreq
      lastStatusTime
      helpRequested
      BEVer
      FEVer
      HWVer
      sessionStartTime
      SN
      }
    }`
