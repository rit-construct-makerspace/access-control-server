import { gql } from "@apollo/client";
import Equipment from "../types/Equipment";
import Room, { FullRoom } from "../types/Room";
import InventoryItem from "../types/InventoryItem";

export const GET_ZONES = gql`
 query GetZones {
  zones {
    id
    name
    imageUrl
  }
 }
`;

export interface ZoneWithHours {
  id: number;
  name: string;
  hours: [{
    type: string;
    dayOfTheWeek: number;
    time: string;
  }];
  imageUrl: string;
}

export interface FullZone {
  id: number;
  name: string;
  hours: {
    type: string;
    dayOfTheWeek: number;
    time: string;
  }[];
  rooms: Room[]
  imageUrl: string;
}

export interface ZoneWithItems {
  id: number;
  name: string;
  items: InventoryItem[];
}

export const GET_ZONES_WITH_HOURS = gql`
 query GetZonesWithHours {
  zones {
    id
    name
    hours {
      type
      dayOfTheWeek
      time
    }
    imageUrl
  }
 }
`;

export const GET_FULL_ZONES = gql`
  query GetZones {
    zones {
      id
      name
      hours {
        type
        dayOfTheWeek
        time
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

export const GET_ZONES_WITH_ITEMS = gql`
 query GetZonesWithItems {
  zones {
    id
    name
    items {
      id
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
      tags {
        id
        label
        color
      }
    }
  }
 }
`;

export const GET_ZONE_BY_ID = gql`
  query GetZoneByID($id: ID!) {
    zoneByID(id: $id) {
      id
      name
      hours {
        type
        dayOfTheWeek
        time
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
      }
    }
  }
`;

export const UPDATE_ZONE = gql`
  mutation UpdateZone(
    $id: ID!
    $name: String!
    $imageUrl: String
  ) {
    updateZone(
      id: $id
      newZone: { name: $name, imageUrl: $imageUrl }
    ) {
      id
    }
  }
`;

export const DELETE_ZONE = gql`
  mutation DeleteZone($id: ID!) {
    deleteZone(id: $id) {
      id
    }
  }
`;