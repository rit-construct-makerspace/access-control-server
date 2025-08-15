import { Autocomplete, Box, Button, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import { Equipment } from "./EditEquipmentPage";
import { ARCHIVE_EQUIPMENT, PUBLISH_EQUIPMENT, UPDATE_EQUIPMENT } from "../../../queries/equipmentQueries";
import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import EquipmentCard from "../../../common/EquipmentCard";
import { useIsMobile } from "../../../common/IsMobileProvider";
import GET_ROOMS from "../../../queries/roomQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import SaveIcon from '@mui/icons-material/Save';
import EquipmentTrainings from "./EquipmentTrainings";
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';

interface EquipmentInformationProps {
  equipment: Equipment;
}

export default function EquipmentInformation(props: EquipmentInformationProps) {
  const isMobile = useIsMobile();

  const getRoomsResult = useQuery(GET_ROOMS);

  const [updateEquipment] = useMutation(UPDATE_EQUIPMENT, {
    refetchQueries: ["GetEquipmentByID"],
    onCompleted() {
      toast.success("Updaeted equipment");
    },
    onError(error) {
      toast.error(`Failed to update equipment: ${error.message}`);
    },
  });
  const [publishEquipment] = useMutation(PUBLISH_EQUIPMENT, {
    variables: { id: props.equipment.id },
    refetchQueries: ["GetEquipmentByID"]
  });
  const [archiveEquipment] = useMutation(ARCHIVE_EQUIPMENT, {
    variables: { id: props.equipment.id },
    refetchQueries: ["GetEquipmentByID"]
  });

  const [name, setName] = useState(props.equipment.name);
  const [imageUrl, setImageUrl] = useState(props.equipment.imageUrl);
  const [sopUrl, setSopUrl] = useState(props.equipment.sopUrl);
  const [notes, setNotes] = useState(props.equipment.notes);
  const [byReservation, setByReservation] = useState(props.equipment.byReservationOnly);
  const [needsWelcome, setNeedsWelcome] = useState(props.equipment.needsWelcome);
  const [requiresTrainer, setRequiresTrainer] = useState(props.equipment.requiresTrainerApproval);
  const [room, setRoom] = useState(props.equipment.room);
  const [moduleIDs, setModuleIds] = useState(props.equipment.trainingModules.map((mod) => (mod.id)));

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
        requiresTrainerApproval: requiresTrainer
      }
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

  return (
    <Stack direction={isMobile ? "column-reverse" : "row"} width={"100%"} justifyContent={"space-between"}>
      <Stack width={isMobile ? "100%" : "49%"} spacing={2}>
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
          <Typography variant="h5" fontWeight={"bold"}>Machine Information</Typography>
          <Stack direction={"row"} spacing={2}>
            {/* Upload image button goes here */}
            <Button
              variant="contained"
              color="info"
            >
              Upload
            </Button>
            {
              props.equipment.archived
                ? <Button
                  color="success"
                  variant="contained"
                  startIcon={<UnarchiveIcon />}
                  onClick={() => publishEquipment()}
                >
                  Publish
                </Button>
                : <Button
                  color="error"
                  variant="contained"
                  startIcon={<ArchiveIcon />}
                  onClick={() => archiveEquipment()}
                >
                  Archive
                </Button>
            }
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleEquipmentUpdate}
            >
              Save
            </Button>
          </Stack>
        </Stack>

        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="SOP URL"
          value={sopUrl}
          onChange={(e) => setSopUrl(e.target.value)}
        />
        <RequestWrapper2 result={getRoomsResult} render={(data) => {

          const rooms = data.rooms; // TODO: filter to only rooms in THIS makerspace
          return (
            <Autocomplete
              renderInput={(params: any) => (
                <TextField {...params} label="Location" />
              )}
              /* Autocomplete's value prop wants undefined, not null.
              * But if we give it undefined then it thinks it's an
              * uncontrolled prop and throws a console error
              * when we set the value. This is a MUI problem.
              * @ts-ignore */
              value={props.equipment.room}
              options={rooms}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.name}
              onChange={(e, value) => setRoom(value)}
              disableClearable
            />
          );
        }} />
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
        <Stack direction={"row"} justifyContent={"space-around"}>
          <FormControlLabel
            control={<Switch checked={byReservation} onChange={(e) => setByReservation(e.target.checked)} />}
            label={<b>Available By Reservation Only</b>}
            labelPlacement="top"
          />
          <FormControlLabel
            control={<Switch checked={needsWelcome} onChange={(e) => setNeedsWelcome(e.target.checked)} />}
            label={<b>Needs Welcome</b>}
            labelPlacement="top"
          />
          <FormControlLabel
            control={<Switch checked={requiresTrainer} onChange={(e) => setRequiresTrainer(e.target.checked)} />}
            label={<b>Requires Trainer to Approve</b>}
            labelPlacement="top"
          />
        </Stack>
        <EquipmentTrainings
          equipmentID={props.equipment.id}
          equipmentModules={props.equipment.trainingModules}
          addModule={(mID) => {
            setModuleIds([...moduleIDs, mID])
          }}
          removeModule={(mID) => {
            var temp = [...moduleIDs];
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
            }}
            isMobile={isMobile}
            staffMode={false} />
        </Box>
      </Stack>

    </Stack>
  );
}