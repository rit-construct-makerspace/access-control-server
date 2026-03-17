import { Stack, Typography } from "@mui/material";
import PrettyModal from "../../../common/PrettyModal";
import { Core } from "../../../queries/deviceQueries";

interface CoreDeploymentModalProps {
  core: Core;
  open: boolean;
  onClose: () => void;
}

export default function CoreDeploymentModal(props: CoreDeploymentModalProps) {

  return (
    <PrettyModal open={props.open} onClose={props.onClose} width={"800px"}>
      <Typography variant="h5">{props.core.device.name}</Typography>
      <Typography variant="subtitle1">SN: {props.core.device.SN}</Typography>
      <Stack direction={"row"} width={"100%"}>
        {/* Config & Flags */}
        <Stack width={"33%"} spacing={4}>
          <Stack spacing={1}>
            <Typography variant="subtitle1">Config</Typography>
          </Stack>
          <Stack spacing={1}>
            <Typography variant="subtitle1">Flags</Typography>
          </Stack>
        </Stack>
        {/* Deployment */}
        <Stack width={"66%"}>

        </Stack>
      </Stack>
    </PrettyModal>
  );
}