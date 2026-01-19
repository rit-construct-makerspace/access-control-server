import { Button, Card, CardActionArea, CardContent, Chip, Stack, Typography } from "@mui/material";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { GET_MAINTENANCE_TICKETS, MaintenanceTicket, MaintenanceTicketSeverity, MaintenanceTicketStatus, MaintenanceTicketType, MODIFY_MAINTENANCE_TICKET_STATUS } from "../../../queries/maintenanceTicketQueries";
import { useMutation, useQuery } from "@apollo/client";
import TaskIcon from '@mui/icons-material/Task';
import EditIcon from '@mui/icons-material/Edit';
import ThemedMarkdown from "../../../common/ThemedMarkdown";
import { toast } from "react-toastify";
import MaintenanceTicketModal from "./MaintenanceTicketModal";
import { useState } from "react";

interface MaintenanceTicketRowProps {
  equipmentID: number
}

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

export default function MaintenanceTicketRow(props: MaintenanceTicketRowProps) {

  const maintenanceTickets = useQuery(GET_MAINTENANCE_TICKETS, {
    variables: {
      equipmentIDs: [Number(props.equipmentID)],
      status: [MaintenanceTicketStatus.TODO, MaintenanceTicketStatus.IN_PROGRESS]
    }
  });

  const [modifyTicketStatus] = useMutation(MODIFY_MAINTENANCE_TICKET_STATUS, { refetchQueries: ["MaintenanceTickets"] });

  async function handleCloseTicket(ticketID: number) {
    try {
      await modifyTicketStatus({
        variables: {
          id: ticketID,
          status: MaintenanceTicketStatus.CLOSED
        }
      })
    } catch (e) {
      toast.error("Failed to close ticket: " + e);
      return;
    }

    toast.success("Closed ticket!")
  }

  const [manageTicketModal, setManageTicketModal] = useState(false);
  const [targetTicket, setTargetTicket] = useState<MaintenanceTicket>();

  return (
    <RequestWrapper2 result={maintenanceTickets} render={(data) => {

      const tickets: MaintenanceTicket[] = data.maintenanceTickets;

      return (
        <Stack width={"100%"} overflow={"auto"} direction={"row"} spacing={3}>
          {
            tickets.map((ticket) => (
              <Card sx={{ minWidth: "450px", minHeight: "400px", padding: "20px" }}>
                <Stack spacing={2} height={"91%"}>
                  <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
                    <Typography variant="h5">{ticket.instance.name}</Typography>
                    <Typography variant="subtitle1">{formatter.format(Number(ticket.dateCreated))}</Typography>
                  </Stack>
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
                    onClick={() => handleCloseTicket(ticket.id)}
                  >
                    Close Ticket
                  </Button>
                  <Button
                    color="info"
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => { setTargetTicket(ticket); setManageTicketModal(true) }}
                  >
                    Manage
                  </Button>
                </Stack>
              </Card>
            ))
          }
          <MaintenanceTicketModal open={manageTicketModal} onClose={() => setManageTicketModal(false)} ticket={targetTicket} />
        </Stack>
      );
    }} />
  );
}