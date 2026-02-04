import { Button, Card, Chip, Stack, Typography } from "@mui/material";
import { MaintenanceTicket, MaintenanceTicketSeverity, MaintenanceTicketStatus, MaintenanceTicketType } from "../../../queries/maintenanceTicketQueries";
import ThemedMarkdown from "../../../common/ThemedMarkdown";
import EditIcon from '@mui/icons-material/Edit';
import { useState } from "react";
import MaintenanceTicketModal from "./MaintenanceTicketModal";
import { useIsMobile } from "../../../common/IsMobileProvider";

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

export default function MaintenanceTicketCard(props: { ticket: MaintenanceTicket }) {
  const isMobile = useIsMobile();

  const [manageTicketModal, setManageTicketModal] = useState(false);

  return (
    <Card sx={{ height: "100%", padding: "20px" }}>
      <Stack height={"100%"} justifyContent={"space-between"}>
        <Stack spacing={2}>
          <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
            <Typography variant="h5">{props.ticket.instance.name}</Typography>
            <Typography variant="subtitle1">{formatter.format(Number(props.ticket.dateCreated))}</Typography>
          </Stack>
          <Stack direction={"row"} justifyContent={"space-between"}>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {`Reported by:${isMobile ? "\n" : " "}${props.ticket.type === MaintenanceTicketType.AUTOMATIC ? "SERVER" : props.ticket.creator?.ritUsername ?? ""}`}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {`Assigned to:${isMobile ? "\n" : " "}${props.ticket.assigned
                ? `${props.ticket.assigned.firstName} (${props.ticket.assigned.ritUsername})`
                : "No one"}`}
            </Typography>
          </Stack>
          <Stack direction={"row"} justifyContent={"space-between"}>
            <Stack direction={isMobile ? "column" : "row"} spacing={1} alignItems={isMobile ? undefined : "center"}>
              <Typography variant="body1">Severity:</Typography>
              <Chip
                color={props.ticket.severity === MaintenanceTicketSeverity.HIGH
                  ? "error"
                  : props.ticket.severity === MaintenanceTicketSeverity.MEDIUM
                    ? "warning"
                    : "info"
                }
                label={props.ticket.severity}
              />
            </Stack>
            <Stack direction={isMobile ? "column" : "row"} spacing={1} alignItems={isMobile ? undefined : "center"}>
              <Typography>Status:</Typography>
              <Chip
                color={
                  props.ticket.status === MaintenanceTicketStatus.TODO
                    ? "info"
                    : props.ticket.status === MaintenanceTicketStatus.IN_PROGRESS
                      ? "warning"
                      : "error"
                }
                label={props.ticket.status}
              />
            </Stack>
          </Stack>
          <ThemedMarkdown>{props.ticket.description}</ThemedMarkdown>
        </Stack>
        <Stack spacing={1}>
          {
            props.ticket.imageUrl
              ? <Typography textAlign={"center"} variant="body2" sx={{ fontStyle: "italic" }}>{"<This ticket has an attached image>"}</Typography>
              : null
          }
          <Stack justifyContent={"end"} direction={"row"}>
            <Button
              color="info"
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setManageTicketModal(true)}
            >
              Manage
            </Button>
          </Stack>
        </Stack>
      </Stack>
      <MaintenanceTicketModal open={manageTicketModal} onClose={() => setManageTicketModal(false)} ticket={props.ticket} />
    </Card>
  );
}