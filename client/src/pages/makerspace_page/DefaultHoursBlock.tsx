import * as TimeUtils from "../../common/TimeUtils"
import { Button, Checkbox, FormControlLabel, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { ZoneDefaultHours } from "../../types/ZoneHours";
import { useState } from "react";
import WatchLaterIcon from '@mui/icons-material/WatchLater';

interface DefaultHoursBlockProps {
  hours: ZoneDefaultHours;
}

export default function DefaultHoursBlock(props: DefaultHoursBlockProps) {

  const [closed, setClosed] = useState(props.hours.closed);

  return (
    <Stack alignItems={"center"} spacing={1} padding={"15px"} width={"14vw"}>
      <Typography fontWeight={"bold"} color="primary">{TimeUtils.dayToString(props.hours.dayOfWeek)}</Typography>
      <TextField
        label="Open"
        type="time"
        disabled={closed}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <WatchLaterIcon />
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
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <WatchLaterIcon />
              </InputAdornment>
            )
          }
        }}
        fullWidth
      />
      <Stack direction={"row"} justifyContent={"space-between"} width={"100%"}>
        <FormControlLabel control={<Checkbox checked={closed} onClick={() => setClosed(!closed)} />} label={"Closed"} />
        <Button variant="outlined" color="success">
          Update
        </Button>
      </Stack>
    </Stack>
  );
}