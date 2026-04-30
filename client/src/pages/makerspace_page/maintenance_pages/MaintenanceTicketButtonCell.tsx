import { useState } from "react";
import { MaintenanceTicket } from "../../../queries/maintenanceTicketQueries";
import { Button, Stack } from "@mui/material";
import MaintenanceTicketModal from "./MaintenanceTicketModal";

export default function MaintenanceTicketButtonCell(props: { ticket?: MaintenanceTicket }) {
  const [open, setOpen] = useState(false);

  if (!props.ticket) {
    return;
  }

  return (
    <Stack height={"100%"} justifyContent={"center"}>
      <Button
        color="info"
        variant="contained"
        onClick={() => setOpen(true)}
      >
        View Ticket
      </Button>
      <MaintenanceTicketModal ticket={props.ticket} open={open} onClose={() => setOpen(false)} />
    </Stack>
  );
}