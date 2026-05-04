import { Alert, Grid } from "@mui/material";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { GET_MAINTENANCE_TICKETS, MaintenanceTicket, MaintenanceTicketStatus } from "../../../queries/maintenanceTicketQueries";
import { useQuery } from "@apollo/client/react";
import MaintenanceTicketCard from "./MaintenanceTicketCard";
import { useIsMobile } from "../../../common/IsMobileProvider";

interface MaintenanceTicketGridProps {
  equipmentID: number
}

export default function MaintenanceTicketGrid(props: MaintenanceTicketGridProps) {
  const isMobile = useIsMobile();

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
        <Grid width={"100%"} container spacing={3}>
          {
            tickets.length > 0
              ? tickets.map((ticket) => (
                <Grid key={ticket.id} width={isMobile ? "100%" : "24%"}>
                  <MaintenanceTicketCard ticket={ticket} />
                </Grid>
              ))
              : <Alert severity="success" variant="filled" sx={{ width: "100%" }}>No Open Tickets!</Alert>
          }

        </Grid>
      );
    }} />
  );
}