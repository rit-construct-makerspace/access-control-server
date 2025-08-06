import * as TimeUtils from "../../common/TimeUtils"
import { Button, Checkbox, FormControlLabel, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { ZoneDefaultHours } from "../../types/ZoneHours";
import { useState } from "react";
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";

export const UPDATE_DEFAULT_HOURS = gql`
  mutation UpdateDefaultHours($hours: DefaultHoursInput!) {
    updateDefaultHours(hours: $hours)
  }
`;

interface DefaultHoursBlockProps {
  hours: ZoneDefaultHours;
}

export default function DefaultHoursBlock(props: DefaultHoursBlockProps) {


  const [closed, setClosed] = useState(props.hours.closed);
  const [open, setOpen] = useState(props.hours.open?.substring(0, 5));
  const [close, setClose] = useState(props.hours.close?.substring(0, 5));

  const [updateHours] = useMutation(UPDATE_DEFAULT_HOURS, {
    refetchQueries: ["GetZoneDefaultHours"], // Doesn't work for some reason
    awaitRefetchQueries: true,
  });

  return (
    <Stack alignItems={"center"} spacing={1} padding={"15px"} width={"14vw"}>
      <Typography fontWeight={"bold"} color="primary">{TimeUtils.dayToString(props.hours.dayOfWeek)}</Typography>
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
            updateHours({
              variables: {
                hours: {
                  dayOfWeek: props.hours.dayOfWeek,
                  makerspaceID: props.hours.makerspaceID,
                  open: open,
                  close: close,
                  closed: closed,
                }
              }
            })
          }}
        >
          Update
        </Button>
      </Stack>
    </Stack>
  );
}