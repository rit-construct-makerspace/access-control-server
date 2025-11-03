import { gql } from "@apollo/client";

export const GET_EQUIPMENTS = gql`
  query GetEquipment {
    equipments {
      id
      name
      archived
      imageUrl
      sopUrl
      trainingModules {
        id
        name
      }
      numAvailable
      numInUse
      byReservationOnly
      requiresInPerson
      room {
        makerspace {
          id
        }
      }
    }
  }
`;

export const GET_ALL_EQUIPMENTS = gql`
  query GetAllEquipment {
    allEquipment {
      id
      name
      archived
    }
  }
`;

export const GET_EQUIPMENT_BY_ID = gql`
  query GetEquipmentByID($id: ID!) {
    equipment(id: $id) {
      id
      name
      archived
      imageUrl
      sopUrl
      room {
        id
        name
        makerspace {
          id
          name
        }
      }
      trainingModules {
        id
        name
        archived
      }
      notes
      numAvailable
      numInUse
      byReservationOnly
      needsWelcome
      requiresTrainerApproval
      requiresInPerson
    }
  }
`;

export const GET_ANY_EQUIPMENT_BY_ID = gql`
  query GetAnyEquipment($id: ID!) {
    anyEquipment(id: $id) {
      id
      name
      archived
      imageUrl
      sopUrl
      room {
        id
        name
      }
      trainingModules {
        id
        name
      }
      notes
      numAvailable
      numInUse
      byReservationOnly
      needsWelcome
      requiresInPerson
    }
  }
`;

export const GET_CORRESPONDING_MACHINE_BY_READER_ID = gql`
  query GetCorrespondingEquipment($readerid: ID!) {
    correspondingEquipment(readerid: $readerid) {
      id
      name
      archived
      imageUrl
      sopUrl
      room {
        id
        name
      }
      trainingModules {
        id
        name
      }
      notes
      numAvailable
      numInUse
      byReservationOnly
      needsWelcome
      requiresInPerson
    }
  }
`;



export const GET_ARCHIVED_EQUIPMENTS = gql`
  query GetArchivedEquipment {
    archivedEquipments {
      id
      name
      archived
      imageUrl
      sopUrl
      byReservationOnly
      needsWelcome
      requiresInPerson
    }
  }
`;

export const GET_ARCHIVED_EQUIPMENT_BY_ID = gql`
  query GetArchivedEquipment($id: ID!) {
    archivedEquipment(id: $id) {
      id
      name
      archived
      imageUrl
      sopUrl
      room {
        id
        name
      }
      trainingModules {
        id
        name
      }
      notes
      byReservationOnly
      needsWelcome
      requiresInPerson
    }
  }
`;

export const GET_RESERVABLE_EQUIPMENT_FOR_MODULE = gql`
  query GetReservableEquipment($moduleID: ID!) {
    module(id: $moduleID) {
      id
      equipment {
        id
        name
      }
    }
  }
`;

export const UPDATE_EQUIPMENT = gql`
  mutation UpdateEquipment(
    $id: ID!
    $name: String!
    $roomID: ID!
    $moduleIDs: [ID]!
    $imageUrl: String!
    $sopUrl: String!
    $notes: String!
    $byReservationOnly: Boolean
    $needsWelcome: Boolean
    $requiresTrainerApproval: Boolean
    $requiresInPerson: Boolean
  ) {
    updateEquipment(
      id: $id
      equipment: {
        name: $name,
        roomID: $roomID,
        moduleIDs: $moduleIDs,
        imageUrl: $imageUrl,
        sopUrl: $sopUrl,
        notes: $notes,
        byReservationOnly: $byReservationOnly,
        needsWelcome: $needsWelcome,
        requiresTrainerApproval: $requiresTrainerApproval,
        requiresInPerson: $requiresInPerson
      }
    ) {
      id
    }
  }
`;

export const ARCHIVE_EQUIPMENT = gql`
  mutation ArchiveEquipment($id: ID!) {
    archiveEquipment(id: $id) {
      id
    }
  }
`;

export const PUBLISH_EQUIPMENT = gql`
  mutation ArchiveEquipment($id: ID!) {
    publishEquipment(id: $id) {
      id
    }
  }
`;

export const CREATE_EQUIPMENT = gql`
  mutation CreateEquipment(
    $name: String!, 
    $roomID: ID!, 
    $moduleIDs: [ID]!,
    $imageUrl: String!
    $sopUrl: String!
    $notes: String!
    $byReservationOnly: Boolean
    $needsWelcome: Boolean
    $requiresTrainerApproval: Boolean
    ) {
    addEquipment(
      equipment: { name: $name, roomID: $roomID, moduleIDs: $moduleIDs, imageUrl: $imageUrl, sopUrl: $sopUrl, notes: $notes, byReservationOnly: $byReservationOnly, needsWelcome: $needsWelcome, requiresTrainerApproval: $requiresTrainerApproval }
    ) {
      id
    }
  }
`;


export default GET_EQUIPMENTS;
