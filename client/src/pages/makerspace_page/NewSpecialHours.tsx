import * as TimeUtils from "../../common/TimeUtils"
import { Button, Checkbox, FormControlLabel, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import ZoneHours, { ZoneDefaultHours } from "../../types/ZoneHours";
import { useState } from "react";
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import gql from "graphql-tag";
import { split, useMutation } from "@apollo/client";
import { GET_ZONE_SPECIAL_HOURS } from "./ManageMakerspaceHours";
import { useParams } from "react-router-dom";

const ADD_SPECIAL_HOURS = gql`
  mutation AddSpecialHours($hours: SpecialHoursInput!) {
    addSpecialHours(hours: $hours)
  }
`;

export default function NewSpecialHoursBlock() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const [closed, setClosed] = useState(true);
  const [open, setOpen] = useState("");
  const [close, setClose] = useState("");
  const [date, setDate] = useState("");

  const splitDate = date.split("-");

  const [createHours] = useMutation(ADD_SPECIAL_HOURS, { refetchQueries: [{ query: GET_ZONE_SPECIAL_HOURS, variables: { makerspaceID: makerspaceID } }] })

  return (
    <Stack alignItems={"center"} spacing={1} padding={"15px"} width={"14vw"}>
      <TextField
        label="Day"
        type="date"
        required
        value={date}
        onChange={(e) => setDate(e.target.value)}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <WatchLaterIcon color="secondary" />
              </InputAdornment>
            )
          }
        }}
        fullWidth
      />
      <TextField
        label="Open"
        type="time"
        disabled={closed}
        value={open}
        onChange={(e) => setOpen(e.target.value)}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <WatchLaterIcon color="secondary" />
              </InputAdornment>
            )
          }
        }}
        fullWidth
      />
      <TextField
        label="Close"
        type="time"
        disabled={closed}
        value={close}
        onChange={(e) => setClose(e.target.value)}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <WatchLaterIcon color="secondary" />
              </InputAdornment>
            )
          }
        }}
        fullWidth
      />
      <Stack direction={"row"} justifyContent={"space-between"} width={"100%"}>
        <FormControlLabel control={<Checkbox checked={closed} onClick={() => setClosed(!closed)} />} label={"Closed"} />
        <Button
          variant="outlined"
          color="success"
          onClick={() => {
            createHours({
              variables: {
                hours: {
                  day: new Date(Number(splitDate[0]), Number(splitDate[1]) - 1, Number(splitDate[2])),
                  makerspaceID: makerspaceID,
                  open: open === "" ? null : open,
                  close: close === "" ? null : close,
                  closed: closed,
                }
              }
            })
          }}
        >
          Create
        </Button>
      </Stack>
    </Stack>
  );
}