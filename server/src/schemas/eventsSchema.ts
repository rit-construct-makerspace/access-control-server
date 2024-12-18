/**
 * eventsSchema.ts
 * GraphQL declarations for Events
 */

import { gql } from "graphql-tag";

export const EventsTypeDefs = gql`
    type Event {
        name: TextField
        description: TextField
        url: String
        start: TimeField
        end: TimeField
        summary: String
        logo: Logo
    }

    type TextField {
        text: String
        html: String
    }

    type TimeField {
        timezone: String
        local: String
        utc: String
    }

    type Logo {
        url: String
    }

    extend type Query {
        events: [Event]
    }
`;