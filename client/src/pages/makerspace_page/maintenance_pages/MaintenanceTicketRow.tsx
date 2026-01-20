import { Alert, Stack, Typography } from "@mui/material";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { GET_MAINTENANCE_TICKETS, MaintenanceTicket, MaintenanceTicketStatus } from "../../../queries/maintenanceTicketQueries";
import { useQuery } from "@apollo/client";
import MaintenanceTicketCard from "./MaintenanceTicketCard";

interface MaintenanceTicketRowProps {
  equipmentID: number
}

export default function MaintenanceTicketRow(props: MaintenanceTicketRowProps) {

  const maintenanceTickets = useQuery(GET_MAINTENANCE_TICKETS, {
    variables: {
      equipmentIDs: [Number(props.equipmentID)],
      status: [MaintenanceTicketStatus.TODO, MaintenanceTicketStatus.IN_PROGRESS]
    }
  });

  return (
    <RequestWrapper2 result={maintenanceTickets} render={(data) => {

      const tickets: MaintenanceTicket[] = data.maintenanceTickets;

      return (
        <Stack width={"100%"} overflow={"auto"} direction={"row"} spacing={3}>
          {
            tickets.length > 0
              ? tickets.map((ticket) => (
                <MaintenanceTicketCard ticket={ticket} />
              ))
              : <Alert severity="success" variant="filled" sx={{ width: "100%" }}>No Open Tickets!</Alert>
          }

        </Stack>
      );
    }} />
  );
}