import { Autocomplete, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, IconButton, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import PrettyModal from "../../../common/PrettyModal";
import { Core, CoreActions, CoreInputMode, SEND_CORE_ACTION, SEND_CORE_FLAGS, UNPAIR_CORE } from "../../../queries/deviceQueries";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AccessControllerRow from "./AccessControllerRow";
import PowerOffIcon from '@mui/icons-material/PowerOff';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

interface CoreDeploymentModalProps {
  core: Core;
  open: boolean;
  onClose: () => void;
}

export default function CoreDeploymentModal(props: CoreDeploymentModalProps) {

  const [inputMode, setInputMode] = useState<CoreInputMode>(props.core.inputMode);

  const [lockWhenIdle, setLockWhenIdle] = useState<boolean | undefined>(props.core.flags.lockWhenIdle);
  const [restartWhenIdle, setRestartWhenIdle] = useState<boolean | undefined>(props.core.flags.restartWhenUnused);
  const [confirmSeal, setConfirmSeal] = useState(false);
  const [confirmUnpair, setConfirmUnpair] = useState(false);
  const [tab, setTab] = useState<"controllers" | "deployment">("controllers");

  const [sendCoreAction] = useMutation(SEND_CORE_ACTION, { refetchQueries: ["GetMakerspaceWithDevices"], awaitRefetchQueries: true });
  const [sendCoreFlags] = useMutation(SEND_CORE_FLAGS);
  const [unpairCore] = useMutation(UNPAIR_CORE, { refetchQueries: ["GetMakerspaceWithDevices"] })

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
            restartWhenUnused: restartWhenIdle ?? false
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
              label="Restart When Unused"
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
        {/* Controllers & Deployment */}
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
            <Stack height={"100%"} spacing={1}>
              <Stack height={"100%"} direction={"row"} justifyContent={"space-between"}>
                <Stack width={"48%"}>
                  <Typography variant="subtitle1">Sealed Deployment</Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>{props.core.sealedDeployment}</Typography>
                </Stack>
                <Stack width={"48%"}>
                  <Typography variant="subtitle1">Reported Deployment</Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>{props.core.reportedDeployment}</Typography>
                </Stack>
              </Stack>
              <Stack direction={"row"} justifyContent={"space-between"}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => props.core.channels !== props.core.controllers.length ? setConfirmSeal(true) : handleSendCoreAction(CoreActions.SEAL)}
                  startIcon={<VerifiedUserIcon />}
                >
                  SEAL Deployment
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setConfirmUnpair(true)}
                  startIcon={<PowerOffIcon />}
                >
                  Unpair Core
                </Button>
              </Stack>
            </Stack>
          }
        </Stack>
      </Stack>
      {/* Confirm Seal Dialog */}
      <Dialog open={confirmSeal}>
        <DialogTitle>
          Access Controllers will be Destroyed
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            The number of channels the Core is reporting is different than the number of Access Controllers created for this device.
            For safety, the existing Access Controllers will be destroyed and the correct number will be created.
            This will unpair any equipment currently paired with this deployment.
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
      {/* Confirm Unpair Dialog */}
      <Dialog open={confirmUnpair}>
        <DialogTitle>
          Core will be Unpaired from the Server
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This core will no longer be able to connect to the server. Its access controllers will be deleted,
            and it will be unpaired from all paired equipment and makerspaces.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            onClick={() => setConfirmUnpair(false)}
          >
            Cancel
          </Button>
          <Button
            color="success"
            onClick={() => { unpairCore({ variables: { deviceID: props.core.device.id } }); setConfirmUnpair(false); props.onClose() }}
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </PrettyModal >
  );
}