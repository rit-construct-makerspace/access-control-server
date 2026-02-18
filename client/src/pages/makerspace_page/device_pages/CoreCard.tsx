import { Autocomplete, Button, Card, IconButton, Stack, TextField, Typography } from "@mui/material";
import { Core } from "../../../queries/deviceQueries";
import TimeAgo from "react-timeago";
import LanIcon from '@mui/icons-material/Lan';
import SendIcon from '@mui/icons-material/Send';

interface CoreCardProps {
  core: Core;
}

export function CoreCard(props: CoreCardProps) {

  return (
    <Card variant="outlined">
      <Stack
        direction={"row"}
        sx={{ padding: "5px 10px", width: "100%" }}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Stack
          spacing={4}
          direction={"row"}
          alignItems={"center"}
          sx={{ height: "100%" }}
        >
          <Stack sx={{ width: "325px" }}>
            <Typography variant="subtitle1">{props.core.device.name}</Typography>
            <Typography variant="body1"><b>SN:</b> {props.core.device.SN}</Typography>
            <Typography variant="body1"><b>Device ID:</b> {props.core.device.id}</Typography>
          </Stack>
          <Stack sx={{ width: "300px" }}>
            <Typography variant="body1"><b>HW:</b> {props.core.device.hardwareVersion}</Typography>
            <Typography variant="body1"><b>FW:</b> {props.core.device.firmwareVersion}</Typography>
            <Typography variant="body1"><b>Target FW:</b> {props.core.device.targetFirmware}</Typography>
          </Stack>
          <Stack sx={{ width: "400px" }}>
            <Typography variant="body1"><b>Last Online:</b> <TimeAgo date={props.core.lastStatusTime} /></Typography>
            <Typography variant="body1"><b>Machine:</b> osillyscope</Typography>
            <Typography variant="body1"><b>User:</b> user</Typography>
          </Stack>
          <Stack sx={{ width: "300px" }}>
            <Typography variant="body1"><b>State:</b> state</Typography>
            <Stack direction={"row"} spacing={1} alignItems={"center"}>
              <Autocomplete
                renderInput={(params) => (
                  <TextField
                    {...params}
                  />
                )}
                options={[]}
                fullWidth
              />
              <IconButton
                color="success"
              >
                <SendIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
        <Button
          color="secondary"
          variant="contained"
          startIcon={<LanIcon />}
          sx={{
            height: "min-content",
          }}
        >
          Manage Deployment
        </Button>
      </Stack>
    </Card>
  );
}