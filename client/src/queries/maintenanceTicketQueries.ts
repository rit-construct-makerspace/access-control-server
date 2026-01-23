import { gql } from "@apollo/client";
import { CurrentUser } from "../common/CurrentUserProvider";
import { EquipmentInstance } from "./equipmentInstanceQueries";

export enum MaintenanceTicketType {
  AUTOMATIC = "AUTOMATIC",
  REPORTED = "REPORTED"
}

export enum MaintenanceTicketSeverity {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW"
}

export enum MaintenanceTicketStatus {
  UPCOMING = "UPCOMING",
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  CLOSED = "CLOSED"
}

export interface MaintenanceTicket {
  id: number,
  type: MaintenanceTicketType,
  severity: MaintenanceTicketSeverity,
  status: MaintenanceTicketStatus,
  description: string,
  imageUrl: string | null,
  dateCreated: string,
  dateClosed: string | null,
  creator: CurrentUser | null,
  instance: EquipmentInstance,
  assigned: CurrentUser | null,
  intervalHours: number | null
}

export const PAGINATED_MAINTENANCE_TICKETS = gql`
  query PaginatedMaintenanceTickets($pagination: Pagination!, $sort: Sort, $filter: Filter, $makerspaceID: Int) {
    paginatedMaintenanceTickets(pagination: $pagination, sort: $sort, filter: $filter, makerspaceID: $makerspaceID) {
      id
      type
      severity
      status
      description
      imageUrl
      dateCreated
      dateClosed
      intervalHours
      creator {
        id
        ritUsername
      }
      instance {
        id
        name
        equipment {
          id
          name
        }
      }
      assigned {
        id
        ritUsername
        firstName
        lastName
      }
    }
  }
`;

export const GET_MAINTENANCE_TICKET = gql`
  query MaintenanceTicket($id: Int!) {
    maintenanceTicket(id: $id) {
      id
      type
      severity
      status
      description
      imageUrl
      dateCreated
      dateClosed
      creator {
        id
        ritUsername
      }
      instance {
        id
        name
        equipment {
          id
          name
        }
      }
    }
  }
`;

export const CREATE_MAINTENANCE_TICKET = gql`
  mutation CreateMaintenanceTicket(
    $severity: MaintenanceTicketSeverity!,
    $instanceID: Int!,
    $userID: Int!,
    $description: String!,
    $imageUrl: String
  ) {
    createMaintenanceTicket(
      severity: $severity,
      instanceID: $instanceID,
      userID: $userID,
      description: $description,
      imageUrl: $imageUrl
    ) {
      id
    }
  }
`;

export const GET_MAINTENANCE_TICKETS = gql`
  query MaintenanceTickets(
    $makerspaceIDs: [Int],
    $equipmentIDs: [Int],
    $instanceIDs: [Int],
    $status: [MaintenanceTicketStatus]
  ) {
    maintenanceTickets(makerspaceIDs: $makerspaceIDs, equipmentIDs: $equipmentIDs, instanceIDs: $instanceIDs, status: $status) {
      id
      type
      severity
      status
      description
      imageUrl
      dateCreated
      dateClosed
      intervalHours
      creator {
        id
        ritUsername
      }
      assigned {
        id
        ritUsername
        firstName
        lastName
      }
      instance {
        id
        name
        equipment {
          id
          name
        }
      }
    }
  }
`;

export const MODIFY_MAINTENANCE_TICKET_STATUS = gql`
  mutation ModifyMaintenanceTicketStatus($id: Int!, $status: MaintenanceTicketStatus!) {
    modifyMaintenanceTicketStatus(id: $id, status: $status)
  }
`;

export const UPDATE_MAINTENACE_TICKET = gql`
  mutation UpdateMaintenanceTicket($id: Int!, $severity: MaintenanceTicketSeverity!, $status: MaintenanceTicketStatus!, $description: String!) {
    updateMaintenanceTicket(id: $id, severity: $severity, status: $status, description: $description)
  }
`;

export const ASSIGN_MAINTENANCE_TICKET = gql`
  mutation AssignMaintenanceTicket($id: Int!, $assignedID: Int) {
    assignMaintenanceTicket(id: $id, assignedID: $assignedID)
  }
`;

export const CREATE_INTERVAL_MAINTENANCE_TICKET = gql`
  mutation CreateIntervalMaintenanceTicket(
    $severity: MaintenanceTicketSeverity,
    $instanceID: Int!,
    $description: String!,
    $startDate: String!,
    $intervalHours: Int!,
    $imageUrl: String
  ) {
    createIntervalMaintenanceTicket(
      severity: $severity,
      instanceID: $instanceID,
      description: $description,
      startDate: $startDate,
      intervalHours: $intervalHours,
      imageUrl: $imageUrl
    ) {
      id
    }
  }
`;

export const DELETE_MAINTENACE_TICKET = gql`
  mutation DeleteMaintenanceTicket($id: Int!) {
    deleteMaintenanceTicket(id: $id)
  }
`;