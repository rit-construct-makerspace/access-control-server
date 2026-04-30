import { Autocomplete, Button, IconButton, Stack, TextField, Typography } from "@mui/material";
import PrettyModal from "../../../common/PrettyModal";
import CloseIcon from '@mui/icons-material/Close';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import Equipment from "../../../types/Equipment";
import { FullMakerspace } from "../../../queries/makerspaceQueries";
import { useMemo, useState } from "react";
import { EquipmentInstance, GET_EQUIPMENT_INSTANCES } from "../../../queries/equipmentInstanceQueries";
import { useMutation, useQuery } from "@apollo/client/react";
import { CREATE_MAINTENANCE_TICKET, MaintenanceTicketSeverity } from "../../../queries/maintenanceTicketQueries";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { toast } from "react-toastify";
import FileUploadButton from "../../../common/FileUploadButton";
import styled from "styled-components";
import { makeCDNLink } from "../../../common/ImageFinder";

const StyledImg = styled.img`
  padding: 5px
`;

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
  const [imageUrl, setImageUrl] = useState<string>();

  const equipmentInstancesResult = useQuery(GET_EQUIPMENT_INSTANCES, { variables: { equipmentID: equipment?.id ?? -1 } });
  const [createTicket] = useMutation(CREATE_MAINTENANCE_TICKET, { refetchQueries: ["PaginatedMaintenanceTickets", "MaintenanceTickets"] });

  const EMPTY_ARRAY: EquipmentInstance[] = [];
  const instances: EquipmentInstance[] = equipmentInstancesResult.data?.equipmentInstances ?? EMPTY_ARRAY;

  const reportedInstance: EquipmentInstance | undefined = useMemo(() => {
    if (instances.length === 1) {
      return instances[0];
    } else {
      return instance;
    }
  }, [instances, instance]);

  if (!(props.equipment || props.makerspace) || (props.equipment && props.makerspace)) {
    return;
  }


  const makerspace_equipments_2 = props.makerspace?.rooms.map((room) => (room.equipment))
  const makerspace_equipments = makerspace_equipments_2?.flat(1);

  function handleClose() {
    setEquipment(props.equipment);
    setInstance(undefined);
    setDescription("");
    setSeverity(undefined);
    setImageUrl(undefined);

    props.onClose();
  }

  async function handleCreateTicket() {
    if (!(equipment && reportedInstance && (severity !== undefined))) {
      toast.error("A required field is empty!");
      return;
    }
    try {
      await createTicket({
        variables: {
          severity: severity,
          instanceID: Number(reportedInstance.id),
          userID: Number(user.id),
          description: description,
          imageUrl: imageUrl
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
            ? <Autocomplete
              key={instances.length === 1 ? "auto-selected" : "manual-select"}
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
              value={reportedInstance}
              onChange={(event, newValue) => setInstance(newValue ?? undefined)}
              readOnly={instances.length === 1}
            />
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
          slotProps={{
            htmlInput: {
              maxLength: 255
            }
          }}
          helperText={<Typography variant="body2" sx={{ fontStyle: "italic" }} textAlign={"end"}>{`${description.length}/255`}</Typography>}
        />
        {
          imageUrl
            ? <StyledImg src={makeCDNLink(imageUrl, "user-uploads/")} />
            : null
        }
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Button
            color="error"
            variant="contained"
            startIcon={<CloseIcon />}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <FileUploadButton
            color="info"
            variant="contained"
            text="Upload Image"
            onUpload={(name: string) => setImageUrl(name)}
          />
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