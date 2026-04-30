import { Stack } from "@mui/system";
import PrettyModal from "../../../common/PrettyModal";
import { ASSIGN_MAINTENANCE_TICKET, DELETE_MAINTENACE_TICKET, MaintenanceTicket, MaintenanceTicketSeverity, MaintenanceTicketStatus, MaintenanceTicketType, MODIFY_MAINTENANCE_TICKET_STATUS, UPDATE_MAINTENACE_TICKET } from "../../../queries/maintenanceTicketQueries";
import { Autocomplete, Button, Chip, IconButton, TextField, Typography } from "@mui/material";
import { useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import ThemedMarkdown from "../../../common/ThemedMarkdown";
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import TaskIcon from '@mui/icons-material/Task';
import styled from "styled-components";
import { makeCDNLink } from "../../../common/ImageFinder";
import { useParams } from "react-router-dom";
import { GET_VALID_STAFF } from "../../../queries/makerspaceQueries";
import { CurrentUser, useCurrentUser } from "../../../common/CurrentUserProvider";
import { isManager } from "../../../common/PrivilegeUtils";

interface TicketModalProps {
  open: boolean,
  onClose: () => void,
  ticket: MaintenanceTicket
}

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

const StyledImg = styled.img`
  padding: 5px
  maxHeight: 200px
`;

export default function MaintenanceTicketModal(props: TicketModalProps) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const user = useCurrentUser();

  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(props.ticket.description);
  const [status, setStatus] = useState<MaintenanceTicketStatus>(props.ticket.status);
  const [severity, setSeverity] = useState<MaintenanceTicketSeverity>(props.ticket.severity);
  const [assigned, setAssigned] = useState<CurrentUser | null>(props.ticket.assigned);

  const validStaff = useQuery(GET_VALID_STAFF, { variables: { id: Number(makerspaceID) } });

  const staffOptions: CurrentUser[] = validStaff.data?.getValidStaff ?? [];

  function cancelEdit() {
    if (props.ticket === undefined) {
      return;
    }

    setDescription(props.ticket.description);
    setStatus(props.ticket.status);
    setSeverity(props.ticket.severity);
    setAssigned(props.ticket.assigned);
    setEditing(false);
  }

  const [modifyTicketStatus] = useMutation(MODIFY_MAINTENANCE_TICKET_STATUS, { refetchQueries: ["MaintenanceTickets", "PaginatedMaintenanceTickets"] });
  const [updateTicket] = useMutation(UPDATE_MAINTENACE_TICKET, { refetchQueries: ["MaintenanceTickets", "PaginatedMaintenanceTickets"] });
  const [assignTicket] = useMutation(ASSIGN_MAINTENANCE_TICKET, { refetchQueries: ["MaintenanceTickets", "PaginatedMaintenanceTickets"] });

  const [deleteTicket] = useMutation(DELETE_MAINTENACE_TICKET, {
    refetchQueries: ["MaintenanceTickets", "PaginatedMaintenanceTickets"],
    variables: {
      id: props.ticket.id
    }
  })

  async function handleCloseTicket(ticketID: number) {
    if (!confirm("Are you sure you want to close this ticket?")) {
      return;
    }

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

    setStatus(MaintenanceTicketStatus.CLOSED);
    toast.success("Closed ticket!");
    props.onClose();
  }

  async function handleInProgess(ticketID: number) {
    try {
      await modifyTicketStatus({
        variables: {
          id: ticketID,
          status: MaintenanceTicketStatus.IN_PROGRESS
        }
      })
    } catch (e) {
      toast.error("Failed to mark ticket: " + e);
      return;
    }

    setStatus(MaintenanceTicketStatus.IN_PROGRESS);
    toast.success("Marked ticket as in progress!");
  }

  async function handleSaveTicket(user: CurrentUser | null = assigned) {
    try {
      await updateTicket({
        variables: {
          id: props.ticket.id,
          severity: severity,
          status: status,
          description: description
        }
      })
    } catch (e) {
      toast.error("Failed to save ticket: " + e);
      return;
    }

    try {
      if (props.ticket.assigned?.id !== user?.id) {
        await assignTicket({ variables: { id: props.ticket.id, assignedID: user ? Number(user.id) : null } })
      }
    } catch (e) {
      toast.error("Failed to assign user: " + e);
      return;
    }

    toast.success("Saved ticket!");
    setEditing(false);
  }

  function handleClose() {
    cancelEdit();
    props.onClose();
  }

  function progressButton() {
    if (props.ticket.status === MaintenanceTicketStatus.CLOSED) {
      return null;
    }

    if (props.ticket.assigned === null) {
      return (
        <Button
          color="primary"
          variant="contained"
          startIcon={<AssignmentIcon />}
          onClick={() => { setAssigned(user); handleSaveTicket(user) }}
        >
          Claim Ticket
        </Button>
      );
    }

    switch (props.ticket.status) {
      case MaintenanceTicketStatus.UPCOMING:
      case MaintenanceTicketStatus.TODO:
        return (
          <Button
            color="warning"
            variant="contained"
            startIcon={<WatchLaterIcon />}
            onClick={() => handleInProgess(props.ticket.id)}
          >
            Mark In-Progress
          </Button>
        );
      case MaintenanceTicketStatus.IN_PROGRESS:
        return (
          <Button
            color="secondary"
            variant="contained"
            startIcon={<TaskIcon />}
            onClick={() => handleCloseTicket(props.ticket.id)}
          >
            Mark Closed
          </Button>
        );
      default:
        return null;
    }
  }

  return (
    <PrettyModal open={props.open} onClose={handleClose} width={"600px"}>
      <Stack spacing={2}>
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
          <Typography variant="h5">{props.ticket.instance.name}</Typography>
          <Stack direction={"row"} spacing={2}>
            {
              editing && isManager(user)
                ? <IconButton onClick={() => confirm("Delete Ticket?") ? deleteTicket() : null} color="error">
                  <DeleteIcon />
                </IconButton>
                : null
            }
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Typography variant="subtitle1">{`Ticket #${props.ticket.id}`}</Typography>
          <Typography variant="subtitle1">{`Created: ${formatter.format(Number(props.ticket.dateCreated))}`}</Typography>
        </Stack>
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
          <Typography variant="body1">{`Reported by: ${props.ticket.type === MaintenanceTicketType.REPORTED ? props.ticket.creator?.ritUsername ?? "" : "SERVER"}`}</Typography>
          {
            editing
              ? <Autocomplete
                renderInput={
                  (params) => (
                    <TextField
                      {...params}
                      label="Assign"
                      placeholder="Select User..."
                      required
                    />
                  )
                }
                options={staffOptions}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.ritUsername})`}
                value={assigned}
                onChange={(event, newValue) => (setAssigned(newValue ?? null))}
                sx={{
                  minWidth: "300px"
                }}
              />
              : <Typography variant="body1">
                {`Assigned to: ${props.ticket.assigned ? props.ticket.assigned.ritUsername : "No one"}`}
              </Typography>
          }
        </Stack>
        <Stack justifyContent={"space-between"} direction={"row"}>
          {
            editing
              ? <Autocomplete
                renderInput={
                  (params) => (
                    <TextField
                      {...params}
                      label="Severity"
                      placeholder="Select Severity..."
                      required
                    />
                  )
                }
                options={
                  [MaintenanceTicketSeverity.HIGH, MaintenanceTicketSeverity.MEDIUM, MaintenanceTicketSeverity.LOW]
                }
                value={severity}
                onChange={(event, newValue) => (newValue ? setSeverity(newValue) : null)}
                sx={{
                  minWidth: "200px"
                }}
              />
              : <Stack spacing={1} direction={"row"} alignItems={"center"}>
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
          }
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
                    props.ticket.status === MaintenanceTicketStatus.TODO
                      ? "info"
                      : props.ticket.status === MaintenanceTicketStatus.IN_PROGRESS
                        ? "warning"
                        : "error"
                  }
                  label={props.ticket.status}
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
              slotProps={{
                htmlInput: {
                  maxLength: 255
                }
              }}
              helperText={<Typography variant="body2" sx={{ fontStyle: "italic" }} textAlign={"end"}>{`${description.length}/255`}</Typography>}
            />
            : <Stack spacing={1}>
              <Typography variant="subtitle1">Description</Typography>
              <ThemedMarkdown>
                {description}
              </ThemedMarkdown>
            </Stack>
        }
        {
          props.ticket.imageUrl
            ? <StyledImg src={makeCDNLink(props.ticket.imageUrl, "user-uploads/")} />
            : null
        }
        <Stack direction={"row"} width={"100%"} justifyContent={"space-between"}>
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
          {
            editing
              ? <Button
                color="success"
                variant="contained"
                onClick={() => handleSaveTicket()}
              >
                Save Changes
              </Button>
              : progressButton()
          }
        </Stack>
      </Stack>
    </PrettyModal>
  );
}