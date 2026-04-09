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

export interface MakerspaceWithHours {
  id: number;
  name: string;
  subtitle: string | null;
  location: string | null;
  description: string;
  docsLink: string;
  hours: MakerspaceHours[];
  imageUrl: string;
}

export interface FullMakerspace {
  id: number;
  name: string;
  subtitle: string | null;
  location: string | null;
  description: string;
  docsLink: string;
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
    subtitle
    location
    description
    docsLink
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
      subtitle
      location
      description
      docsLink
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
          needsWelcome
          requiresInPerson
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
    name
    subtitle
    location
    description
    docsLink
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

export const GET_MAKERSPACE_WITH_ITEMS = gql`
  query GetMakerspaceByID($id: ID!) {
    makerspaceByID(id: $id) {
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
      subtitle
      location
      description
      docsLink
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
        archived
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
          needsWelcome
          requiresInPerson
          schedulable
          notes
          archived
          subName
          signOffUrl
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
    $subtitle: String
    $location: String
    $description: String
    $docsLink: String
    $imageUrl: String
  ) {
    updateMakerspace(
      id: $id
      newMakerspace: { name: $name, subtitle: $subtitle, location: $location, description: $description, docsLink: $docsLink, imageUrl: $imageUrl }
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

export const UPDATE_DEFAULT_HOURS = gql`
  mutation UpdateDefaultHours($hours: DefaultHoursInput!) {
    updateDefaultHours(hours: $hours)
  }
`;

export const DELETE_SPECIAL_HOURS = gql`
  mutation DeleteSpecialHours($day: DateTime!, $makerspaceID: ID!) {
    deleteSpecialHours(day: $day, makerspaceID: $makerspaceID)
  }
`;

export const GET_VALID_STAFF = gql`
  query GetValidStaff($id: Int!) {
    getValidStaff(id: $id) {
      id
      ritUsername
      firstName
      lastName
    }
  }
`;

export const GET_MAKERSPACE_WITH_DEVICES = gql`
  query GetMakerspaceWithDevices($id: ID!) {
    makerspaceByID(id: $id) {
      id
      name
      genericDevices {
        id
        name
        SN
      }
      cores {
        channels
        lastStatusTime
        sealedDeployment
        reportedDeployment
        device {
          id
          name
          SN
          hardwareVersion
          firmwareVersion
          targetFirmware
        }
        controllers {
          id
          channelID
          state
        }
        instance {
          id
          name
          equipment {
            id
            name
          }
        }
        welcomeSpace {
          id
          name
        }
        activeUser {
          id
          ritUsername
        }
        state
        flags {
          lockWhenIdle
          restartWhenUnused
        }
      }
      dispensers {
        cardsLeft
      }
    }
  }
`;

export const GET_SMALL_MAKERSPACE = gql`
  query GetSmallMakerspace($id: ID!) {
    makerspaceByID(id: $id) {
      id
      name
    }
  }
`;