import { Autocomplete, AutocompleteRenderInputParams, Button, IconButton, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import PrettyModal from "../../../common/PrettyModal";
import CloseIcon from '@mui/icons-material/Close';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import Equipment from "../../../types/Equipment";
import { FullMakerspace } from "../../../queries/makerspaceQueries";
import { useState } from "react";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { EquipmentInstance, GET_EQUIPMENT_INSTANCES } from "../../../queries/equipmentInstanceQueries";
import { useMutation, useQuery } from "@apollo/client";
import { CREATE_MAINTENANCE_TICKET, MaintenanceTicketSeverity } from "../../../queries/maintenanceTicketQueries";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { justifyContent } from "@mui/system";
import { toast } from "react-toastify";

interface NewTicketModalProps {
  open: boolean,
  onClose: () => void,
  equipment?: Equipment
  makerspace?: FullMakerspace
}

export default function NewTicketModal(props: NewTicketModalProps) {
  const user = useCurrentUser();

  const [equipment, setEquipment] = useState(props.equipment);
  const [instance, setInstance] = useState<EquipmentInstance>();
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<MaintenanceTicketSeverity>();

  if (!(props.equipment || props.makerspace) || (props.equipment && props.makerspace)) {
    return;
  }

  const equipmentInstancesResult = useQuery(GET_EQUIPMENT_INSTANCES, { variables: { equipmentID: equipment?.id ?? -1 } });
  const [createTicket] = useMutation(CREATE_MAINTENANCE_TICKET, { refetchQueries: ["PaginatedMaintenanceTickets",] });

  const makerspace_equipments_2 = props.makerspace?.rooms.map((room) => (room.equipment))
  const makerspace_equipments = makerspace_equipments_2?.flat(1);

  function handleClose() {
    setEquipment(props.equipment);
    setInstance(undefined);
    setDescription("");
    setSeverity(undefined);

    props.onClose();
  }

  async function handleCreateTicket() {
    if (!(equipment && instance && (severity !== undefined))) {
      toast.error("A required field is empty!");
      return;
    }
    try {
      await createTicket({
        variables: {
          severity: severity,
          instanceID: Number(instance.id),
          userID: Number(user.id),
          description: description
        }
      })
    } catch (e) {
      toast.error("Failed to create ticket: " + e);
      handleClose();
      return;
    }

    toast.success("Created ticket!");
    handleClose();
    return;
  }

  return (
    <PrettyModal open={props.open} onClose={handleClose} width={"620px"}>
      <Stack spacing={2} padding={"10px"}>
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Typography variant="h6">Create a Maintenance Ticket</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Autocomplete
          renderInput={
            (params) => (
              <TextField
                {...params}
                label="Equipment"
                placeholder="Select Equipment..."
                required
              />
            )
          }
          options={makerspace_equipments ?? [props.equipment]}
          getOptionLabel={(option) => (option?.name ?? "You shouldn't see this")}
          value={equipment}
          readOnly={props.equipment ? true : false}
          onChange={(event, newValue) => setEquipment(newValue ?? undefined)}
        />
        {
          equipment
            ? <RequestWrapper2 result={equipmentInstancesResult} render={(data) => {

              const instances: EquipmentInstance[] = data.equipmentInstances;

              return (
                <Autocomplete
                  renderInput={
                    (params) => (
                      <TextField
                        {...params}
                        label="Instance"
                        placeholder="Select Instance..."
                        required
                      />
                    )
                  }
                  options={instances}
                  getOptionLabel={(option) => (option?.name ?? "You shouldn't see this")}
                  value={instance}
                  onChange={(event, newValue) => setInstance(newValue ?? undefined)}
                />
              );
            }} />
            : <Autocomplete
              renderInput={
                (params) => (
                  <TextField
                    {...params}
                    label="Instance"
                    placeholder="Select Instance..."
                    required
                  />
                )
              }
              options={[]}
              disabled
            />
        }
        <Autocomplete
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
          options={[MaintenanceTicketSeverity.HIGH, MaintenanceTicketSeverity.MEDIUM, MaintenanceTicketSeverity.LOW]}
          value={severity}
          onChange={(event, newValue) => setSeverity(newValue ?? undefined)}
        />
        <TextField
          label={"Description"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={3}
        />
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Button
            color="error"
            variant="contained"
            startIcon={<CloseIcon />}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            color="success"
            variant="contained"
            startIcon={<NoteAddIcon />}
            onClick={handleCreateTicket}
          >
            Create Ticket
          </Button>
        </Stack>
      </Stack>
    </PrettyModal >
  );
}