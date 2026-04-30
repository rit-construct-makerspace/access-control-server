import * as TimeUtils from "../../common/TimeUtils"
import { Button, Checkbox, FormControlLabel, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { MakerspaceDefaultHours } from "../../types/MakerspaceHours";
import { useState } from "react";
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { UPDATE_DEFAULT_HOURS } from "../../queries/makerspaceQueries";
import { useIsMobile } from "../../common/IsMobileProvider";

interface DefaultHoursBlockProps {
  hours: MakerspaceDefaultHours;
}

export default function DefaultHoursBlock(props: DefaultHoursBlockProps) {
  const isMobile = useIsMobile();

  const [closed, setClosed] = useState(props.hours.closed);
  const [open, setOpen] = useState(props.hours.open?.substring(0, 5));
  const [close, setClose] = useState(props.hours.close?.substring(0, 5));

  const [updateHours] = useMutation(UPDATE_DEFAULT_HOURS, {
    refetchQueries: ["GetMakerspaceDefaultHours"], // Doesn't work for some reason
    awaitRefetchQueries: true,
    onCompleted() {
      toast.success(`Updated ${TimeUtils.dayToString(props.hours.dayOfWeek)} hours`)
    },
    onError(error) {
      toast.error(`Failed to update ${TimeUtils.dayToString(props.hours.dayOfWeek)} hours: ${error.message}`)
    },
  });

  return (
    <Stack alignItems={"center"} spacing={1} padding={"15px"} width={isMobile ? "100%" : "14vw"}>
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