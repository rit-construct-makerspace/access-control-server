import { gql } from "@apollo/client";

export const GET_NUM_SITE_VISITS = gql`
  query GetNumSiteVisits {
    dailySiteVisits {
      value
    }
  }
`;

export const GET_NUM_ROOM_SWIPES_TODAY = gql`
  query GetNumRoomSwipesToday {
    numRoomSwipesToday
  }
`;

export const GET_NUM_EQUIPMENT_SESSIONS_TODAY = gql`
  query GetNumEquipmentSessionsToday {
    numEquipmentSessionsToday
  }
`;

export const GET_NUM_NEW_USERS = gql`
  query GetNumNewUsersToday {
    numNewUsersToday
  }
`;

export const GET_EQUIPMENT_SESSIONS_BY_DOW = gql`
  query GetEquipmentSessionsByDayOfTheWeek($dayOfTheWeek: String!) {
    equipmentSessionsByDayOfTheWeek(dayOfTheWeek: $dayOfTheWeek) {
      id
      start
      sessionLength
      readerSlug
      equipmentID
    }
  }
`;

export const GET_EQUIPMENT_SESSIONS = gql`
  query GetEquipmentSessions(
    $startDate: String
    $stopDate: String
  ) {
    equipmentSessions(
      startDate: $startDate
      stopDate: $stopDate
    ) {
      id
      start
      sessionLength
      readerSlug
      equipment {
        id
        name
      }
      room {
        id
        name
      }
      zone {
        id
        name
      }
    }
  }
`;

export const GET_ZONE_HOURS = gql`
  query GetZoneHours {
    zoneHours {
      id
      zoneID
      type
      dayOfTheWeek
      time
    }
  }
`;

export const GET_ROOM_SWIPE_COUNTS = gql`
  query SumRoomSwipesByRoomByWeekDayByHour(
    $sumStartDate: String
    $sumStopDate: String
    $avgStartDate: String
    $avgStopDate: String
  ) {
    sumRoomSwipesByRoomByWeekDayByHour(
      sumStartDate: $sumStartDate
      sumStopDate: $sumStopDate
      avgStartDate: $avgStartDate
      avgStopDate: $avgStopDate
    ) {
      day
      roomID
      data {
        hour
        sum
        avg
      }
    }
  }
`;