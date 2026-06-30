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
    UPCOMING
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
    intervalHours: Int
    assignedID: Int
    instance: EquipmentInstance!
    creator: User
    assigned: User
  }

  input Pagination {
    page: Int!
    pageSize: Int!
  }

  input Sort {
    target: String!
    dir: String!
  }

  input Filter {
    equipment: [Int]!
    severity: [MaintenanceTicketSeverity]!
    status: [MaintenanceTicketStatus]!
  }

  extend type Query {
    maintenanceTicket(id: Int!): MaintenanceTicket
    maintenanceTickets(makerspaceIDs: [Int], equipmentIDs: [Int], instanceIDs: [Int], status: [MaintenanceTicketStatus]): [MaintenanceTicket]
    paginatedMaintenanceTickets(pagination: Pagination!, sort: Sort, filter: Filter, makerspaceID: Int): [MaintenanceTicket]
  }

  extend type Mutation {
    createMaintenanceTicket(
      severity: MaintenanceTicketSeverity!
      instanceID: Int!
      userID: Int!
      description: String!
      imageUrl: String
    ): MaintenanceTicket

    createIntervalMaintenanceTicket(
      severity: MaintenanceTicketSeverity,
      instanceID: Int!,
      description: String!,
      startDate: String!,
      intervalHours: Int!,
      imageUrl: String
    ): MaintenanceTicket

    modifyMaintenanceTicketStatus(id: Int!, status: MaintenanceTicketStatus!): Int

    updateMaintenanceTicket(id: Int!, severity: MaintenanceTicketSeverity!, status: MaintenanceTicketStatus!, description: String!): Int
    assignMaintenanceTicket(id: Int!, assignedID: Int): Int
    deleteMaintenanceTicket(id: Int!): Int
  }
`;