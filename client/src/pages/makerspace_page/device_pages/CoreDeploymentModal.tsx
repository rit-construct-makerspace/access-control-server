import { Autocomplete, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, IconButton, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import PrettyModal from "../../../common/PrettyModal";
import { Core, CoreActions, CoreInputMode, SEND_CORE_ACTION, SEND_CORE_FLAGS } from "../../../queries/deviceQueries";
import { useMutation } from "@apollo/client";
import { toast } from "react-toastify";
import { useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AccessControllerRow from "./AccessControllerRow";

interface CoreDeploymentModalProps {
  core: Core;
  open: boolean;
  onClose: () => void;
}

export default function CoreDeploymentModal(props: CoreDeploymentModalProps) {

  const [inputMode, setInputMode] = useState<CoreInputMode>(props.core.inputMode);

  const [lockWhenIdle, setLockWhenIdle] = useState<boolean | undefined>(props.core.flags.lockWhenIdle);
  const [restartWhenIdle, setRestartWhenIdle] = useState<boolean | undefined>(props.core.flags.restartWhenIdle);
  const [confirmSeal, setConfirmSeal] = useState(false);
  const [tab, setTab] = useState<"controllers" | "deployment">("controllers");

  const [sendCoreAction] = useMutation(SEND_CORE_ACTION);
  const [sendCoreFlags] = useMutation(SEND_CORE_FLAGS);

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

  async function hanldeSendCoreFlags() {
    try {
      await sendCoreFlags({
        variables: {
          deviceID: props.core.device.id,
          flags: {
            lockWhenIdle: lockWhenIdle ?? false,
            restartWhenIdle: restartWhenIdle ?? false
          }
        }
      });
      toast.success("Flags Sent!");
    } catch (e) {
      toast.error(`Failed to send flags: ${e}`);
    }
  }

  return (
    <PrettyModal open={props.open} onClose={props.onClose} width={"1000px"}>
      <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
        <Typography variant="h5">{props.core.device.name}</Typography>
        <IconButton onClick={props.onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <Typography variant="subtitle1">SN: {props.core.device.SN}</Typography>
      <Stack direction={"row"} width={"100%"} spacing={4}>
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
            <Button
              variant="contained"
              color="secondary"
              endIcon={<SendIcon />}
            >
              Send Config
            </Button>
          </Stack>
          <Stack spacing={1}>
            <Typography variant="subtitle1">Flags</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={lockWhenIdle}
                  onChange={(_e, checked) => setLockWhenIdle(checked)}
                  color="primary"
                />
              }
              label="Lock When Idle"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={restartWhenIdle}
                  onChange={(_e, checked) => setRestartWhenIdle(checked)}
                  color="primary"
                />
              }
              label="Restart When Idle"
            />
            <Button
              variant="contained"
              color="secondary"
              endIcon={<SendIcon />}
              onClick={hanldeSendCoreFlags}
            >
              Send Flags
            </Button>
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
        <Stack width={"66%"} spacing={1}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tab} onChange={(_e, newValue) => setTab(newValue)}>
              <Tab label="Controllers" value={"controllers"} />
              <Tab label="Deployment" value={"deployment"} />
            </Tabs>
          </Box>
          {
            tab === "controllers" &&
            <Stack height={"100%"} spacing={1}>
              {
                props.core.controllers.map((controller) => <AccessControllerRow controller={controller} />)
              }
            </Stack>
          }
          {
            tab === "deployment" &&
            <Stack height={"100%"}>
              deployment
              <Button
                variant="contained"
                color="primary"
                onClick={() => props.core.channels !== props.core.controllers.length ? setConfirmSeal(true) : handleSendCoreAction(CoreActions.SEAL)}
              >
                SEAL Deployment
              </Button>
            </Stack>
          }
        </Stack>
      </Stack>
      <Dialog open={confirmSeal}>
        <DialogTitle>
          Access Controllers will be Destroyed
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            The number of channels the Core is reporting is different than the number of Access Controllers created for this device.
            For saftey, the existing Access Controllers will be destroyed and the correct number will be created.
            Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            onClick={() => setConfirmSeal(false)}
          >
            Cancel
          </Button>
          <Button
            color="success"
            onClick={() => { handleSendCoreAction(CoreActions.SEAL); setConfirmSeal(false) }}
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </PrettyModal >
  );
}