import { gql } from "graphql-tag";

export const MaintenanceTicketTypeDefs = gql`
  
  enum MaintenanceTicketType {
    AUTOMATIC
    REPORTED
  }

  enum MaintenanceTicketSeverity {
    HIGH
    MEDIUM
    LOW
  }

  type MaintenanceTicket {
    id: Int!
    type: MaintenanceTicketType!
    severity: MaintenanceTicketSeverity!
    instanceID: Int!
    userID: Int!
    description: String!
    imageUrl: String
    closed: Boolean!
    dateCreated: String!
    dateClosed: String
  }

  extend type Query {
    maintenanceTicket(id: Int!): MaintenanceTicket
    maintenanceTickets(makerspaceIDs: [Int], equipmentIDs: [Int], instanceIDs: [Int], closed: Boolean): [MaintenanceTicket]
  }

  extend type Mutation {
    createMaintenanceTicket(
      type: MaintenanceTicketType!
      severity: MaintenanceTicketSeverity!
      instanceID: Int!
      userID: Int!
      description: String!
      imageUrl: String
    ): MaintenanceTicket

    modifyMaintenanceTicketClosed(id: Int!, closed: Boolean!): Int
  }
`;