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
  creator: CurrentUser | undefined,
  instance: EquipmentInstance
}

export const PAGINATED_MAINTENANCE_TICKETS = gql`
  query PaginatedMaintenanceTickets($pagination: Pagination!) {
    paginatedMaintenanceTickets(pagination: $pagination) {
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