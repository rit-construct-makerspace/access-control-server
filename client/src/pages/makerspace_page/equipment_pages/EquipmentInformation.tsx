import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Equipment } from "./EditEquipmentPage";
import { ARCHIVE_EQUIPMENT, PUBLISH_EQUIPMENT, UPDATE_EQUIPMENT } from "../../../queries/equipmentQueries";
import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import EquipmentCard from "../../../common/EquipmentCard";
import { useIsMobile } from "../../../common/IsMobileProvider";
import GET_ROOMS from "../../../queries/roomQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import SaveIcon from "@mui/icons-material/Save";
import EquipmentTrainings from "./EquipmentTrainings";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import FileUploadButton from "../../../common/FileUploadButton";
import { GET_FULL_MAKERSPACES } from "../../../queries/makerspaceQueries.js";
import { useBlocker } from "react-router-dom";

interface EquipmentInformationProps {
  equipment: Equipment;
}

export default function EquipmentInformation(props: EquipmentInformationProps) {
  const isMobile = useIsMobile();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => unsaved && currentLocation.pathname !== nextLocation.pathname
  );

  const getRoomsResult = useQuery(GET_ROOMS);

  const [updateEquipment] = useMutation(UPDATE_EQUIPMENT, {
    refetchQueries: ["GetEquipmentByID", { query: GET_ROOMS }, { query: GET_FULL_MAKERSPACES }],
    onCompleted() {
      toast.success("Updated equipment");
    },
    onError(error) {
      toast.error(`Failed to update equipment: ${error.message}`);
    },
  });
  const [publishEquipment] = useMutation(PUBLISH_EQUIPMENT, {
    variables: { id: props.equipment.id },
    refetchQueries: ["GetEquipmentByID", { query: GET_ROOMS }],
  });
  const [archiveEquipment] = useMutation(ARCHIVE_EQUIPMENT, {
    variables: { id: props.equipment.id },
    refetchQueries: ["GetEquipmentByID", { query: GET_ROOMS }],
  });

  const [name, setName] = useState(props.equipment.name);
  const [imageUrl, setImageUrl] = useState(props.equipment.imageUrl);
  const [sopUrl, setSopUrl] = useState(props.equipment.sopUrl);
  const [notes, setNotes] = useState(props.equipment.notes);
  const [byReservation, setByReservation] = useState(props.equipment.byReservationOnly);
  const [needsWelcome, setNeedsWelcome] = useState(props.equipment.needsWelcome);
  const [requiresTrainer, setRequiresTrainer] = useState(props.equipment.requiresTrainerApproval);
  const [requiresInPerson, setRequiresInPerson] = useState(props.equipment.requiresInPerson);
  const [room, setRoom] = useState(props.equipment.room);
  const [moduleIDs, setModuleIds] = useState(props.equipment.trainingModules.map((mod) => mod.id));
  const [unsaved, setUnsaved] = useState(false);
  const [blockerDialogOpen, setBlockerDialogOpen] = useState(false);

  function handleEquipmentUpdate() {
    updateEquipment({
      variables: {
        id: props.equipment.id,
        name: name,
        roomID: room.id,
        moduleIDs: moduleIDs,
        imageUrl: imageUrl,
        sopUrl: sopUrl,
        notes: notes,
        byReservationOnly: byReservation,
        needsWelcome: needsWelcome,
        requiresTrainerApproval: requiresTrainer,
        requiresInPerson: requiresInPerson,
      },
    });
  }

  useEffect(() => {
    if (imageUrl !== props.equipment.imageUrl) {
      handleEquipmentUpdate();
    }
  }, [imageUrl]);

  useEffect(() => {
    if (moduleIDs.length !== props.equipment.trainingModules.length) {
      handleEquipmentUpdate();
    }
  }, [moduleIDs]);

  useEffect(() => {
    setUnsaved(
      name !== props.equipment.name ||
        imageUrl !== props.equipment.imageUrl ||
        sopUrl !== props.equipment.sopUrl ||
        notes !== props.equipment.notes ||
        byReservation !== props.equipment.byReservationOnly ||
        needsWelcome !== props.equipment.needsWelcome ||
        requiresTrainer !== props.equipment.requiresTrainerApproval ||
        requiresInPerson !== props.equipment.requiresInPerson ||
        room.id !== props.equipment.room.id ||
        moduleIDs.length !== props.equipment.trainingModules.length
    );
  }, [
    name,
    imageUrl,
    sopUrl,
    notes,
    byReservation,
    needsWelcome,
    requiresTrainer,
    requiresInPerson,
    room.id,
    moduleIDs.length,
  ]);

  useEffect(() => {
    if (blocker.state === "blocked") {
      setBlockerDialogOpen(true);
    }
  }, [blocker.state]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (unsaved) {
        event.preventDefault();
        return "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [unsaved]);

  return (
    <Stack direction={isMobile ? "column-reverse" : "row"} width={"100%"} justifyContent={"space-between"}>
      <Stack width={isMobile ? "100%" : "49%"} spacing={2}>
        <Stack direction={isMobile ? "column" : "row"} justifyContent={"space-between"} alignItems={"center"}>
          <Typography variant="h5" fontWeight={"bold"}>
            Machine Information
          </Typography>
          <Stack direction={"row"} spacing={2}>
            {/* Upload image button goes here */}
            <FileUploadButton
              color="info"
              variant="contained"
              text="Upload Image"
              onUpload={(name: string) => setImageUrl(name)}
            />
            {props.equipment.archived ? (
              <Button
                color="success"
                variant="contained"
                startIcon={<UnarchiveIcon />}
                onClick={() => publishEquipment()}
              >
                Publish
              </Button>
            ) : (
              <Button color="error" variant="contained" startIcon={<ArchiveIcon />} onClick={() => archiveEquipment()}>
                Archive
              </Button>
            )}
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleEquipmentUpdate}>
              Save
            </Button>

            {blocker.state === "blocked" && (
              <Dialog
                open={blockerDialogOpen}
                onClose={() => {
                  setBlockerDialogOpen(false);
                }}
                aria-labelledby="blocker-dialog-title"
                aria-describedby="blocker-dialog-description"
              >
                <DialogTitle id="blocker-dialog-title">Unsaved Changes</DialogTitle>
                <DialogContent>
                  <DialogContentText id="blocker-dialog-description">
                    You have unsaved changes. Are you sure you want to leave?
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => blocker.reset()}>Stay on Page</Button>
                  <Button onClick={() => blocker.proceed()}>Leave Page</Button>
                </DialogActions>
              </Dialog>
            )}
          </Stack>
        </Stack>

        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="SOP URL" value={sopUrl} onChange={(e) => setSopUrl(e.target.value)} />
        <RequestWrapper2
          result={getRoomsResult}
          render={(data) => {
            const rooms = data.rooms; // TODO: filter to only rooms in THIS makerspace
            return (
              <Autocomplete
                renderInput={(params: any) => <TextField {...params} label="Location" />}
                value={props.equipment.room}
                options={rooms}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => option.name}
                onChange={(e, value) => setRoom(value)}
                disableClearable
              />
            );
          }}
        />
        <TextField
          label="Description"
          style={{ background: "none", fontFamily: "Roboto", fontSize: "1em", lineHeight: "2em" }}
          aria-label="Description"
          defaultValue={notes}
          placeholder="Description (Markdown Compatible)"
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={3}
        />
        <ToggleButtonGroup
          color="primary"
          value={[
            byReservation ? "byReservation" : null,
            needsWelcome ? "needsWelcome" : null,
            requiresTrainer ? "requiresTrainer" : null,
            requiresInPerson ? "requiresInPerson" : null,
          ]}
          sx={{ alignSelf: "center" }}
        >
          <ToggleButton value={"byReservation"} onClick={() => setByReservation(!byReservation)}>
            Reservation Only
          </ToggleButton>
          <ToggleButton value={"needsWelcome"} onClick={() => setNeedsWelcome(!needsWelcome)}>
            Needs Welcome
          </ToggleButton>
          <ToggleButton value={"requiresTrainer"} onClick={() => setRequiresTrainer(!requiresTrainer)}>
            Requires Trainer Approval
          </ToggleButton>
          <ToggleButton value={"requiresInPerson"} onClick={() => setRequiresInPerson(!requiresInPerson)}>
            Requires In-Person
          </ToggleButton>
        </ToggleButtonGroup>
        <EquipmentTrainings
          equipmentID={props.equipment.id}
          equipmentModules={props.equipment.trainingModules}
          addModule={(mID) => {
            setModuleIds([...moduleIDs, mID]);
          }}
          removeModule={(mID) => {
            const temp = [...moduleIDs];
            temp.splice(temp.indexOf(mID), 1);
            setModuleIds(temp);
          }}
        />
      </Stack>
      <Stack justifyContent={"center"} alignItems={"center"} width={isMobile ? "100%" : "49%"}>
        <Box width={"100%"} height={"min-content"} justifyContent={"center"} display={"grid"}>
          <EquipmentCard
            equipment={{
              id: props.equipment.id,
              name: name,
              imageUrl: imageUrl,
              sopUrl: sopUrl,
              trainingModules: props.equipment.trainingModules,
              numAvailable: props.equipment.numAvailable,
              numInUse: props.equipment.numInUse,
              byReservationOnly: byReservation,
              needsWelcome: needsWelcome,
              notes: notes,
              archived: props.equipment.archived,
              requiresInPerson: requiresInPerson,
            }}
            isMobile={isMobile}
            staffMode={false}
          />
        </Box>
      </Stack>
    </Stack>
  );
}
