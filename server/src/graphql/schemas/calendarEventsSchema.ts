/**
 * calendarEventsSchema.ts
 * DEPRECATED
 */

import { gql } from "graphql-tag";

export interface CalendarEvent {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  timeZone?: string | null;
}

export const CalendarEventsTypeDefs = gql`
  type CalendarEvent {
    id: ID
    status: String
    summary: String
    description: String
    location: String
    startTime: String
    endTime: String
  }

  extend type Query {
    calendarEvents(timeMin: String!, maxResults: Int!): [CalendarEvent]
  }
`;
