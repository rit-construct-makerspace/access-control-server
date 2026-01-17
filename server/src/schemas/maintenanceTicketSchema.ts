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

  enum MaintenanceTicketStatus {
    TODO
    IN_PROGRESS
    CLOSED
  }

  type MaintenanceTicket {
    id: Int!
    type: MaintenanceTicketType!
    severity: MaintenanceTicketSeverity!
    status: MaintenanceTicketStatus!
    instanceID: Int!
    userID: Int
    description: String!
    imageUrl: String
    dateCreated: String!
    dateClosed: String
    instance: EquipmentInstance!
    creator: User
  }

  input Pagination {
    page: Int!
    pageSize: Int!
  }

  extend type Query {
    maintenanceTicket(id: Int!): MaintenanceTicket
    maintenanceTickets(makerspaceIDs: [Int], equipmentIDs: [Int], instanceIDs: [Int], status: MaintenanceTicketStatus): [MaintenanceTicket]
    paginatedMaintenanceTickets(pagination: Pagination!): [MaintenanceTicket]
  }

  extend type Mutation {
    createMaintenanceTicket(
      severity: MaintenanceTicketSeverity!
      instanceID: Int!
      userID: Int!
      description: String!
      imageUrl: String
    ): MaintenanceTicket

    modifyMaintenanceTicketClosed(id: Int!, status: MaintenanceTicketStatus!): Int
  }
`;