import { Autocomplete, Button, IconButton, Stack, TextField, Typography } from "@mui/material";
import PrettyModal from "../../../common/PrettyModal";
import { Core, CoreActions, CoreInputMode, SEND_CORE_ACTION } from "../../../queries/deviceQueries";
import { useMutation } from "@apollo/client";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import CloseIcon from '@mui/icons-material/Close';

interface CoreDeploymentModalProps {
  core: Core;
  open: boolean;
  onClose: () => void;
}

export default function CoreDeploymentModal(props: CoreDeploymentModalProps) {

  const [inputMode, setInputMode] = useState<CoreInputMode>(props.core.inputMode);

  const [sendCoreAction] = useMutation(SEND_CORE_ACTION);

  async function handleSendCoreAction(action: CoreActions) {
    try {
      await sendCoreAction({
        variables: {
          deviceID: props.core.device.id,
          action: action
        }
      });
      toast.success("Command Sent!");
    } catch (e) {
      toast.error(`Failed to send command: ${e}`);
    }
  }

  useEffect(() => console.log(inputMode), [inputMode])

  return (
    <PrettyModal open={props.open} onClose={props.onClose} width={"800px"}>
      <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
        <Typography variant="h5">{props.core.device.name}</Typography>
        <IconButton onClick={props.onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <Typography variant="subtitle1">SN: {props.core.device.SN}</Typography>
      <Stack direction={"row"} width={"100%"}>
        {/* Config & Flags */}
        <Stack width={"33%"} spacing={4}>
          <Stack spacing={1}>
            <Typography variant="subtitle1">Config</Typography>
            <Autocomplete
              key={inputMode}
              renderInput={(params) =>
                <TextField
                  {...params}
                  label="Input Mode"
                />}
              options={[CoreInputMode.INSERT, CoreInputMode.TEMP_PRESENT, CoreInputMode.TEMP_REMOVE, CoreInputMode.TOGGLE]}
              value={inputMode}
              onChange={(e, newValue) => newValue !== null ? setInputMode(newValue) : {}}
              disableClearable
            />
          </Stack>
          <Stack spacing={1}>
            <Typography variant="subtitle1">Flags</Typography>
          </Stack>
          <Stack spacing={1}>
            <Typography variant="subtitle1">Actions</Typography>
            <Button variant="contained" color="success" onClick={() => handleSendCoreAction(CoreActions.RESTART)}>
              Restart
            </Button>
            <Button variant="contained" color="info" onClick={() => handleSendCoreAction(CoreActions.IDENTIFY)}>
              Identify
            </Button>
          </Stack>
        </Stack>
        {/* Deployment */}
        <Stack width={"66%"}>

        </Stack>
      </Stack>
    </PrettyModal>
  );
}