import { Stack } from "@mui/system";
import PrettyModal from "../../../common/PrettyModal";
import { MaintenanceTicket, MaintenanceTicketSeverity, MaintenanceTicketStatus } from "../../../queries/maintenanceTicketQueries";
import { Autocomplete, Button, Chip, IconButton, TextField, Typography } from "@mui/material";
import { useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import ThemedMarkdown from "../../../common/ThemedMarkdown";

interface TicketModalProps {
  open: boolean,
  onClose: () => void,
  ticket: MaintenanceTicket | undefined
}

export default function MaintenanceTicketModal(props: TicketModalProps) {

  if (props.ticket === undefined) {
    return;
  }

  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(props.ticket.description);
  const [status, setStatus] = useState<MaintenanceTicketStatus>(props.ticket.status);

  function cancelEdit() {
    if (props.ticket === undefined) {
      return;
    }

    setDescription(props.ticket.description);
    setStatus(props.ticket.status);
    setEditing(false);
  }

  return (
    <PrettyModal open={props.open} onClose={props.onClose}>
      <Stack spacing={2}>
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Typography variant="h5">{`Ticket #${props.ticket.id}`}</Typography>
          <Stack spacing={2}>
            {
              editing
                ? <Button
                  color="error"
                  variant="contained"
                >
                  Cancel Editing
                </Button>
                : <Button
                  color="info"
                  variant="contained"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
            }
            <IconButton onClick={props.onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
        <Stack justifyContent={"space-between"}>
          <Stack spacing={1}>
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
          {
            editing
              ? <Autocomplete
                renderInput={
                  (params) => (
                    <TextField
                      {...params}
                      label="Status"
                      placeholder="Select Status..."
                      required
                    />
                  )
                }
                options={
                  [MaintenanceTicketStatus.TODO, MaintenanceTicketStatus.IN_PROGRESS, MaintenanceTicketStatus.CLOSED]
                }
                value={status}
                onChange={(event, newValue) => (newValue ? setStatus(newValue) : null)}
              />
              : <Stack>
                <Typography>Status</Typography>
                <Chip
                  color={
                    status === MaintenanceTicketStatus.TODO
                      ? "info"
                      : status === MaintenanceTicketStatus.IN_PROGRESS
                        ? "warning"
                        : "error"
                  }
                  label={status}
                />
              </Stack>
          }
        </Stack>
        {
          editing
            ? <TextField
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              label="Description"
            />
            : <Stack spacing={1}>
              <Typography variant="subtitle1">Description</Typography>
              <ThemedMarkdown>
                {description}
              </ThemedMarkdown>
            </Stack>
        }
      </Stack>
    </PrettyModal>
  );
}