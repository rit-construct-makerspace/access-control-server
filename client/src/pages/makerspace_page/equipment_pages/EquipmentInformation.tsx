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
import { Equipment } from "./ManageEquipmentPage";
import {
  ARCHIVE_EQUIPMENT,
  GET_EQUIPMENT_BY_ID,
  PUBLISH_EQUIPMENT,
  UPDATE_EQUIPMENT,
} from "../../../queries/equipmentQueries";
import { useMutation, useQuery } from "@apollo/client/react";
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
    refetchQueries: [
      { query: GET_EQUIPMENT_BY_ID, variables: { id: props.equipment.id } },
      { query: GET_ROOMS },
      { query: GET_FULL_MAKERSPACES },
    ],
    awaitRefetchQueries: true,
    onCompleted() {
      toast.success("Updated equipment");
    },
    onError(error) {
      toast.error(`Failed to update equipment: ${error.message}`);
    },
  });
  const [publishEquipment] = useMutation(PUBLISH_EQUIPMENT, {
    variables: { id: props.equipment.id },
    refetchQueries: [{ query: GET_EQUIPMENT_BY_ID, variables: { id: props.equipment.id } }, { query: GET_ROOMS }],
  });
  const [archiveEquipment] = useMutation(ARCHIVE_EQUIPMENT, {
    variables: { id: props.equipment.id },
    refetchQueries: [{ query: GET_EQUIPMENT_BY_ID, variables: { id: props.equipment.id } }, { query: GET_ROOMS }],
  });

  const [name, setName] = useState(props.equipment.name);
  const [imageUrl, setImageUrl] = useState(props.equipment.imageUrl);
  const [sopUrl, setSopUrl] = useState(props.equipment.sopUrl);
  const [notes, setNotes] = useState(props.equipment.notes);
  const [byReservation, setByReservation] = useState(props.equipment.byReservationOnly);
  const [needsWelcome, setNeedsWelcome] = useState(props.equipment.needsWelcome);
  const [requiresTrainer, setRequiresTrainer] = useState(props.equipment.requiresTrainerApproval);
  const [requiresInPerson, setRequiresInPerson] = useState(props.equipment.requiresInPerson);
  const [schedulable, setSchedulable] = useState(props.equipment.schedulable);
  const [room, setRoom] = useState(props.equipment.room);
  const [moduleIDs, setModuleIds] = useState(props.equipment.trainingModules.map((mod) => mod.id));
  const [signOffUrl, setSignOffUrl] = useState(props.equipment.signOffUrl);
  const [subName, setSubName] = useState(props.equipment.subName);

  const [blockerDialogOpen, setBlockerDialogOpen] = useState(false);

  function handleEquipmentUpdate(newModules?: number[]) {
    updateEquipment({
      variables: {
        id: props.equipment.id,
        name: name,
        roomID: room.id,
        moduleIDs: newModules ?? moduleIDs,
        imageUrl: imageUrl,
        sopUrl: sopUrl,
        notes: notes,
        byReservationOnly: byReservation,
        needsWelcome: needsWelcome,
        requiresTrainerApproval: requiresTrainer,
        requiresInPerson: requiresInPerson,
        schedulable: schedulable,
        subName: subName,
        signOffUrl: signOffUrl
      },
    });
  }

  const unsaved = name !== props.equipment.name ||
    imageUrl !== props.equipment.imageUrl ||
    sopUrl !== props.equipment.sopUrl ||
    notes !== props.equipment.notes ||
    byReservation !== props.equipment.byReservationOnly ||
    needsWelcome !== props.equipment.needsWelcome ||
    requiresTrainer !== props.equipment.requiresTrainerApproval ||
    requiresInPerson !== props.equipment.requiresInPerson ||
    room.id !== props.equipment.room.id ||
    moduleIDs.length !== props.equipment.trainingModules.length ||
    schedulable !== props.equipment.schedulable

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
              onUpload={(name: string) => { setImageUrl(_old => name); handleEquipmentUpdate(); }}
            />
            {props.equipment.archived ? (
              <Button
                color="success"
                variant="contained"
                startIcon={<UnarchiveIcon />}
                onClick={() => publishEquipment()}
              >
                Unhide
              </Button>
            ) : (
              <Button color="error" variant="contained" startIcon={<ArchiveIcon />} onClick={() => archiveEquipment()}>
                Hide
              </Button>
            )}
            <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleEquipmentUpdate()}>
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
        <TextField label="Sub-Name" value={subName} onChange={(e) => setSubName(e.target.value)} />
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
            requiresInPerson ? "requiresInPerson" : null
          ]}
          sx={{ alignSelf: "center" }}
          fullWidth
        >
          <ToggleButton value={"byReservation"} onClick={() => setByReservation(!byReservation)}>
            Reservation Only
          </ToggleButton>
          <ToggleButton value={"needsWelcome"} onClick={() => setNeedsWelcome(!needsWelcome)}>
            Needs Welcome
          </ToggleButton>
          <ToggleButton value={"requiresInPerson"} onClick={() => setRequiresInPerson(!requiresInPerson)}>
            Requires Sign-Off
          </ToggleButton>
        </ToggleButtonGroup>
        {/* Reservation Settings */}
        {
          byReservation
            ? <Stack spacing={1}>
              <Typography>Reservation Settings</Typography>
              <ToggleButton
                value="schedulable"
                selected={schedulable}
                onClick={() => setSchedulable(!schedulable)}
                color="primary"
                sx={{
                  width: "120px"
                }}
              >
                Schedulable
              </ToggleButton>
            </Stack>
            : null
        }

        {/* Sign-Off Settings */}
        {
          requiresInPerson
            ? <Stack spacing={1}>
              <Typography variant="subtitle1">Sign-Off Settings</Typography>
              <ToggleButton
                value={"requiresTrainer"}
                selected={requiresTrainer}
                onClick={() => setRequiresTrainer(!requiresTrainer)}
                color="primary"
                sx={{
                  width: "250px"
                }}
              >
                Requires Trainer To Approve
              </ToggleButton>
              <TextField label="Sign-Off URL" value={signOffUrl} onChange={(e) => setSignOffUrl(e.target.value)} />
            </Stack>
            : null
        }
        <EquipmentTrainings
          equipmentID={props.equipment.id}
          equipmentModules={props.equipment.trainingModules}
          addModule={(mID) => {
            const newIDs = [...moduleIDs, mID]
            setModuleIds(newIDs);
            handleEquipmentUpdate(newIDs);
          }}
          removeModule={(mID) => {
            setModuleIds((prev) => { prev.splice(prev.indexOf(mID), 1); return prev; });
            handleEquipmentUpdate();
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
              schedulable: schedulable,
              signOffUrl: signOffUrl,
              subName: subName
            }}
            isMobile={isMobile}
            staffMode={false}
            makerspaceTrainings={{
              id: -1,
              name: "boo",
              trainingModules: []
            }}
            roomTrainings={{
              id: -1,
              name: "hiss",
              trainingModules: []
            }}
            preview={true}
          />
        </Box>
      </Stack>
    </Stack>
  );
}
