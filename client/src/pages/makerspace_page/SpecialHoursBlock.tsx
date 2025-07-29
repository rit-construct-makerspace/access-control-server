import * as TimeUtils from "../../common/TimeUtils"
import { Button, Checkbox, FormControlLabel, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import ZoneHours, { ZoneDefaultHours } from "../../types/ZoneHours";
import { useState } from "react";
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { GET_ZONE_SPECIAL_HOURS } from "./ManageMakerspaceHours";
import DeleteIcon from '@mui/icons-material/Delete';

export const DELETE_SPECIAL_HOURS = gql`
  mutation DeleteSpecialHours($day: DateTime!, $makerspaceID: ID!) {
    deleteSpecialHours(day: $day, makerspaceID: $makerspaceID)
  }
`;

interface SpecialHoursBlockProps {
  hours: ZoneHours;
}

export default function SpecialHoursBlock(props: SpecialHoursBlockProps) {

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  })

  const closed = props.hours.closed;
  const open = props.hours.open?.substring(0, 5);
  const close = props.hours.close?.substring(0, 5);

  const [deleteHours] = useMutation(DELETE_SPECIAL_HOURS, {
    refetchQueries: ["GetZoneSpecialHours"],
    variables: { day: props.hours.day, makerspaceID: props.hours.makerspaceID },
    awaitRefetchQueries: true,
  })

  return (
    <Stack alignItems={"center"} spacing={1} padding={"15px"} width={"14vw"}>
      <Typography fontWeight={"bold"} color="primary">{dateFormatter.format(new Date(props.hours.day))}</Typography>
      <TextField
        label="Open"
        type="time"
        disabled
        value={open}
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
        disabled
        value={close}
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
        <FormControlLabel control={<Checkbox checked={closed} />} label={"Closed"} />
        <IconButton
          color="error"
          onClick={() => deleteHours()}
        >
          <DeleteIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
}