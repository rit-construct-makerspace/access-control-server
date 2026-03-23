import { Button, Card, Link, Stack, Typography } from "@mui/material";
import { Core } from "../../../queries/deviceQueries";
import TimeAgo from "react-timeago";
import LanIcon from '@mui/icons-material/Lan';
import { useParams } from "react-router-dom";
import { useState } from "react";
import CoreDeploymentModal from "./CoreDeploymentModal";

interface CoreCardProps {
  core: Core;
}

export function CoreCard(props: CoreCardProps) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const [open, setOpen] = useState(false);

  return (
    <Card variant="outlined">
      <Stack
        direction={"row"}
        sx={{ padding: "5px 10px", width: "100%" }}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Stack
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
          sx={{ height: "100%" }}
          width={"80%"}
        >
          <Stack sx={{ width: "33%" }}>
            <Typography variant="subtitle1">{props.core.device.name}</Typography>
            <Typography variant="body1"><b>SN:</b> {props.core.device.SN}</Typography>
            <Typography variant="body1"><b>Device ID:</b> {props.core.device.id}</Typography>
          </Stack>
          <Stack sx={{ width: "33%" }}>
            <Typography variant="body1"><b>HW:</b> {props.core.device.hardwareVersion}</Typography>
            <Typography variant="body1"><b>FW:</b> {props.core.device.firmwareVersion}</Typography>
            <Typography variant="body1"><b>Target FW:</b> {props.core.device.targetFirmware}</Typography>
          </Stack>
          <Stack sx={{ width: "33%" }}>
            <Typography variant="body1"><b>Last Online:</b> <TimeAgo date={props.core.lastStatusTime} /></Typography>
            <Typography variant="body1"><b>User:</b> {
              props.core.activeUser !== undefined && props.core.activeUser !== null
                ? <Link href={`/app/makerspace/${makerspaceID}/people/${props.core.activeUser.id}`}>{props.core.activeUser.ritUsername}</Link>
                : "No One"
            }
            </Typography>
          </Stack>
        </Stack>
        <Button
          color="secondary"
          variant="contained"
          startIcon={<LanIcon />}
          sx={{
            height: "min-content",
          }}
          onClick={() => setOpen(true)}
        >
          Manage Deployment
        </Button>
        <CoreDeploymentModal core={props.core} open={open} onClose={() => setOpen(false)} />
      </Stack>
    </Card>
  );
}