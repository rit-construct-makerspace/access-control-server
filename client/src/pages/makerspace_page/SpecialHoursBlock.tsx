import { Checkbox, FormControlLabel, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import MakerspaceHours from "../../types/MakerspaceHours";
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import { useMutation } from "@apollo/client/react";
import DeleteIcon from '@mui/icons-material/Delete';
import { DELETE_SPECIAL_HOURS } from "../../queries/makerspaceQueries";
import { useIsMobile } from "../../common/IsMobileProvider";

interface SpecialHoursBlockProps {
  hours: MakerspaceHours;
}

export default function SpecialHoursBlock(props: SpecialHoursBlockProps) {
  const isMobile = useIsMobile();

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
    refetchQueries: ["GetMakerspaceSpecialHours"],
    variables: { day: props.hours.day, makerspaceID: props.hours.makerspaceID },
    awaitRefetchQueries: true,
  })

  return (
    <Stack alignItems={"center"} spacing={1} padding={"15px"} width={isMobile ? "100%" : "14vw"}>
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