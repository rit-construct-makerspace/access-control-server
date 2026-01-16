import { gql } from "@apollo/client";

export const PAGINATED_MAINTENANCE_TICKETS = gql`
  query PaginatedMaintenanceTickets($pagination: Pagination) {
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
`;