import { Stack } from "@mui/system";
import PrettyModal from "../../../common/PrettyModal";
import { MaintenanceTicket, MaintenanceTicketSeverity, MaintenanceTicketStatus, MODIFY_MAINTENANCE_TICKET_STATUS, UPDATE_MAINTENACE_TICKET } from "../../../queries/maintenanceTicketQueries";
import { Autocomplete, Button, Chip, IconButton, TextField, Typography } from "@mui/material";
import { useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import ThemedMarkdown from "../../../common/ThemedMarkdown";
import { useMutation } from "@apollo/client";
import { toast } from "react-toastify";
import TaskIcon from '@mui/icons-material/Task';

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

  const [modifyTicketStatus] = useMutation(MODIFY_MAINTENANCE_TICKET_STATUS, { refetchQueries: ["MaintenanceTickets"] });
  const [updateTicket] = useMutation(UPDATE_MAINTENACE_TICKET, { refetchQueries: ["MaintenanceTickets"] })

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

    toast.success("Closed ticket!");
    props.onClose();
  }

  async function handleSaveTicket() {
    try {
      await updateTicket({
        variables: {
          id: props.ticket?.id,
          severity: props.ticket?.severity,
          status: status,
          description: description
        }
      })
    } catch (e) {
      toast.error("Failed to save ticket: " + e);
      return;
    }

    toast.success("Saved ticket!")
    setEditing(false);
  }

  return (
    <PrettyModal open={props.open} onClose={props.onClose} width={"500px"}>
      <Stack spacing={2}>
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
          <Typography variant="h5">{`Ticket #${props.ticket.id}`}</Typography>
          <Stack spacing={2} direction={"row"}>
            {
              editing
                ? <Button
                  color="error"
                  variant="contained"
                  onClick={cancelEdit}
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
        <Stack justifyContent={"space-between"} direction={"row"}>
          <Stack spacing={1} direction={"row"} alignItems={"center"}>
            <Typography variant="subtitle1">Severity:</Typography>
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
                sx={{
                  minWidth: "200px"
                }}
              />
              : <Stack spacing={1} direction={"row"} alignItems={"center"}>
                <Typography variant="subtitle1">Status: </Typography>
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
        <Stack direction={"row"} width={"100%"} justifyContent={"end"}>
          {
            editing
              ? <Button
                color="success"
                variant="contained"
                onClick={handleSaveTicket}
              >
                Save Changes
              </Button>
              : <Button
                color="secondary"
                variant="contained"
                startIcon={<TaskIcon />}
                onClick={() => handleCloseTicket(props.ticket?.id ?? -1)}
              >
                Close Tikcet
              </Button>
          }
        </Stack>
      </Stack>
    </PrettyModal>
  );
}