import { Autocomplete, Button, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import AddIcon from '@mui/icons-material/Add';
import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { CREATE_EQUIPMENT } from "../../../queries/equipmentQueries";
import GET_ROOMS from "../../../queries/roomQueries";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";


export default function NewEquipmentPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const getRoomsResult = useQuery(GET_ROOMS);

  const [createEquipment] = useMutation(CREATE_EQUIPMENT, {
    onCompleted(data) {
      navigate(`/makerspace/${makerspaceID}/equipment/${data.id}`);
    },
    onError(error) {
      toast.error(`Failed to create equipment: ${error.message}`);
    }
  });

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sopUrl, setSopUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [byReservation, setByReservation] = useState(false);
  const [needsWelcome, setNeedsWelcome] = useState(true);
  const [requiresTrainer, setRequiresTrainer] = useState(false);
  const [room, setRoom] = useState<null | any>(null);

  function handleCreateEquipment() {
    if (name === "" || room === null) {
      window.alert("Name & Room are required fields");
      // Technically there are more required fields but we handle them so they really shouldn't be
      return;
    }

    createEquipment({
      variables: {
        name: name,
        roomID: room.id,
        moduleIDs: [],
        imageUrl: imageUrl,
        sopUrl: sopUrl,
        notes: notes,
        byReservationOnly: byReservation,
        needsWelcome: needsWelcome,
        requiresTrainerApproval: requiresTrainer
      }
    });
  }

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
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateEquipment}
            >
              Create
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
      </Stack>
    </Stack>
  );
}