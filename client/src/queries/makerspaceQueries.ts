import { gql } from "@apollo/client";
import Room from "../types/Room";
import InventoryItem from "../types/InventoryItem";
import { TrainingModule } from "../common/TrainingModuleUtils";
import MakerspaceHours from "../types/MakerspaceHours";

export const GET_MAKERSPACES = gql`
 query GetMakerspaces {
  makerspaces {
    id
    name
    imageUrl
  }
 }
`;

export interface MakerspacesWithHours {
  id: number;
  name: string;
  hours: MakerspaceHours[];
  imageUrl: string;
}

export interface FullMakerspace {
  id: number;
  name: string;
  hours: MakerspaceHours[];
  rooms: Room[]
  imageUrl: string;
  trainingModules: TrainingModule[];
}

export interface MakerspaceWithItems {
  id: number;
  name: string;
  items: InventoryItem[];
}

export const GET_MAKERSPACES_WITH_HOURS = gql`
 query GetMakerspacesWithHours {
  makerspaces {
    id
    name
    hours {
        day
        makerspaceID
        open
        close
        closed
      }
    imageUrl
  }
 }
`;

export const GET_FULL_MAKERSPACES = gql`
  query GetMakerspaces {
    makerspaces {
      id
      name
      hours {
        day
        makerspaceID
        open
        close
        closed
      }
      imageUrl
      rooms {
        id
        name
        equipment {
          id
          name
          imageUrl
          sopUrl
          trainingModules {
            id
            name
          }
          numAvailable
          numInUse
          byReservationOnly
        }
      }
    }
  }
`;

export const GET_MAKERSPACES_WITH_ITEMS = gql`
 query GetMakerspacesWithItems($storefrontVisible: Boolean) {
  makerspaces(storefrontVisible: $storefrontVisible) {
    id
    name
    items {
      id
      image
      name
      labels
      unit
      pluralUnit
      count
      pricePerUnit
      threshold
      staffOnly
      storefrontVisible
      notes
      description
      makerspaceID
      makerspace {
        id
        name
      }
      tags {
        id
        label
        color
      }
    }
  }
 }
`;

export const GET_MAKERSPACE_BY_ID = gql`
  query GetMakerspaceByID($id: ID!) {
    makerspaceByID(id: $id) {
      id
      name
      hours {
        day
        makerspaceID
        open
        close
        closed
      }
      imageUrl
      rooms {
        id
        name
        equipment {
          id
          name
          imageUrl
          sopUrl
          trainingModules {
            id
            name
          }
          numAvailable
          numInUse
          byReservationOnly
          notes
          archived
        }
        trainingModules {
          id
          name
        }
      }
      trainingModules {
        id
        name
      }
    }
  }
`;

export const UPDATE_MAKERSPACE = gql`
  mutation UpdateMakerspace(
    $id: ID!
    $name: String!
    $imageUrl: String
  ) {
    updateMakerspace(
      id: $id
      newMakerspace: { name: $name, imageUrl: $imageUrl }
    ) {
      id
    }
  }
`;

export const DELETE_MAKERSPACE = gql`
  mutation DeleteMakerspace($id: ID!) {
    deleteMakerspace(id: $id) {
      id
    }
  }
`;

export const ADD_TRAINING_TO_MAKERSPACE = gql`
  mutation AddTrainingToMakerspace($makerspaceID: ID!, $moduleID: ID!) {
    addTrainingToMakerspace(makerspaceID: $makerspaceID, moduleID: $moduleID) {
      id
    }
  }
`;

export const REMOVE_TRAINING_FROM_MAKERSPACE = gql`
  mutation RemoveTrainingFromMakerspace($makerspaceID: ID!, $moduleID: ID!) {
    removeTrainingFromMakerspace(makerspaceID: $makerspaceID, moduleID: $moduleID) {
      id
    }
  }
`;