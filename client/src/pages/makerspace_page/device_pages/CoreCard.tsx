import { Autocomplete, Button, Card, IconButton, Link, Stack, TextField, Typography } from "@mui/material";
import { AccessControllerState, Core, SET_CORE_STATE } from "../../../queries/deviceQueries";
import TimeAgo from "react-timeago";
import LanIcon from '@mui/icons-material/Lan';
import SendIcon from '@mui/icons-material/Send';
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "react-toastify";

interface CoreCardProps {
  core: Core;
}

export function CoreCard(props: CoreCardProps) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const [targetState, setTargetState] = useState<AccessControllerState | null>(null);
  const [sendState] = useMutation(SET_CORE_STATE, { refetchQueries: ["GetMakerspaceWithDevices"] });

  async function handleSendState() {
    if (targetState === null) { return; }
    try {
      await sendState({ variables: { deviceID: props.core.device.id, targetState: targetState } });
    } catch (e) {
      toast.error("Failed to send state: " + e);
      return;
    }
  }

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
          <Stack sx={{ width: "500px" }}>
            <Typography variant="body1"><b>Last Online:</b> <TimeAgo date={props.core.lastStatusTime} /></Typography>
            {
              (props.core.instance !== undefined && props.core.instance !== null)
                ? <Typography variant="body1"><b>Instance:</b> <Link href={`/app/makerspace/${makerspaceID}/equipment/${props.core.instance.equipment.id}`}>{`${props.core.instance.equipment.name} | ${props.core.instance.name}`}</Link></Typography>
                : props.core.welcomeSpace !== undefined
                  ? <Typography variant="body1"><b>Makerspace:</b> <Link href={`/app/makerspace/${props.core.welcomeSpace.id}`}>{props.core.welcomeSpace.name}</Link></Typography>
                  : <Typography variant="body1" fontWeight={"bold"}>Unpaired</Typography>
            }
            <Typography variant="body1"><b>User:</b> {
              props.core.activeUser !== undefined && props.core.activeUser !== null
                ? <Link href={`/app/makerspace/${makerspaceID}/people/${props.core.activeUser.id}`}>{props.core.activeUser.ritUsername}</Link>
                : "No One"
            }
            </Typography>
          </Stack>
          <Stack sx={{ width: "300px" }}>
            <Typography variant="body1"><b>State:</b> {props.core.state}</Typography>
            <Stack direction={"row"} spacing={1} alignItems={"center"}>
              <Autocomplete
                renderInput={(params) => (
                  <TextField
                    {...params}
                  />
                )}
                value={targetState}
                options={[AccessControllerState.IDLE, AccessControllerState.ALWAYS_ON, AccessControllerState.LOCKED_OUT, "RESTART"]}
                // @ts-expect-error string not massagable to ACS :(
                onChange={(_e, newValue) => setTargetState(newValue)}
                fullWidth
              />
              <IconButton
                color="success"
                onClick={handleSendState}
                disabled={targetState === null}
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