import { Button, Card, CardActionArea, CardContent, Chip, Stack, Typography } from "@mui/material";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { GET_MAINTENANCE_TICKETS, MaintenanceTicket, MaintenanceTicketSeverity, MaintenanceTicketStatus, MaintenanceTicketType } from "../../../queries/maintenanceTicketQueries";
import { useQuery } from "@apollo/client";
import TaskIcon from '@mui/icons-material/Task';
import EditIcon from '@mui/icons-material/Edit';
import ThemedMarkdown from "../../../common/ThemedMarkdown";

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
            tickets.map((ticket) => (
              <Card sx={{ minWidth: "450px", minHeight: "450px", padding: "20px" }}>
                <Stack spacing={2} height={"93%"}>
                  <Typography variant="h6">{ticket.instance.name}</Typography>
                  <Typography variant="body1">{`Reported by: ${ticket.type === MaintenanceTicketType.AUTOMATIC ? "SERVER" : ticket.creator?.ritUsername ?? ""}`}</Typography>
                  <Stack direction={"row"} justifyContent={"space-between"}>
                    <Stack direction={"row"} spacing={1} alignItems={"center"}>
                      <Typography variant="body1">Severity:</Typography>
                      <Chip
                        color={ticket.severity === MaintenanceTicketSeverity.HIGH
                          ? "error"
                          : ticket.severity === MaintenanceTicketSeverity.MEDIUM
                            ? "warning"
                            : "info"
                        }
                        label={ticket.severity}
                      />
                    </Stack>
                    <Stack direction={"row"} spacing={1} alignItems={"center"}>
                      <Typography>Status:</Typography>
                      <Chip
                        color={
                          ticket.status === MaintenanceTicketStatus.TODO
                            ? "info"
                            : ticket.status === MaintenanceTicketStatus.IN_PROGRESS
                              ? "warning"
                              : "error"
                        }
                        label={ticket.status}
                      />
                    </Stack>
                  </Stack>
                  <ThemedMarkdown>{ticket.description}</ThemedMarkdown>
                </Stack>
                <Stack justifyContent={"space-between"} direction={"row"}>
                  <Button
                    color="secondary"
                    variant="contained"
                    startIcon={<TaskIcon />}
                  >
                    Close
                  </Button>
                  <Button
                    color="info"
                    variant="contained"
                    startIcon={<EditIcon />}
                  >
                    Manage
                  </Button>
                </Stack>
              </Card>
            ))
          }
        </Stack>
      );
    }} />
  );
}