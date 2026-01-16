import { gql } from "@apollo/client";
import { CurrentUser } from "../common/CurrentUserProvider";
import { EquipmentInstance } from "./equipmentInstanceQueries";

export enum MaintenanceTicketType {
  "AUTOMATIC",
  "REPORTED"
}

export enum MaintenanceTicketSeverity {
  "HIGH",
  "MEDIUM",
  "LOW"
}

export enum MaintenanceTicketStatus {
  "TODO",
  "IN_PROGRESS",
  "CLOSED"
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
  creator: CurrentUser,
  instance: EquipmentInstance
}

export const PAGINATED_MAINTENANCE_TICKETS = gql`
  query PaginatedMaintenanceTickets($pagination: Pagination) {
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