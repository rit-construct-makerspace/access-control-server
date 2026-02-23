import { Button, Checkbox, FormControlLabel, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import PrettyModal from "../../../common/PrettyModal";
import { useState } from "react";
import { useParams } from "react-router-dom";

interface ManualDevicePairModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ManualDevicePairModal(props: ManualDevicePairModalProps) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const [device, setDevice] = useState<"generic" | "core" | "dispenser" | null>(null);
  const [SN, setSN] = useState("");
  const [useWifi, setUseWifi] = useState(false);
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");

  const allowPair = device !== null && SN !== "" && ((useWifi && ssid !== "") || !useWifi);

  function handlePair() {
    console.log(device);
  }

  function handleClose() {
    setDevice(null);
    setSN("");
    setUseWifi(false);
    setSsid("");
    setPassword("");

    props.onClose();
  }

  return (
    <PrettyModal open={props.open} onClose={handleClose} width={"800px"}>
      <Stack width={"100%"} spacing={2}>
        <Typography variant="h4" textAlign={"center"}>Manually Pair Device</Typography>
        <Stack
          spacing={1}
        >
          <Typography variant="subtitle1">Hardware Identification</Typography>
          <ToggleButtonGroup
            value={device}
            onChange={(_e, newValue) => setDevice(newValue ?? null)}
            color="primary"
            exclusive
          >
            <ToggleButton
              value={"generic"}
              disabled
              fullWidth
            >
              Generic
            </ToggleButton>
            <ToggleButton
              value={"core"}
              fullWidth
            >
              Core
            </ToggleButton>
            <ToggleButton
              value={"dispenser"}
              disabled
              fullWidth
            >
              Dispenser
            </ToggleButton>
          </ToggleButtonGroup>
          <TextField
            label={"Serial Number"}
            required
            fullWidth
            value={SN}
            onChange={(e) => setSN(e.target.value)}
          />
        </Stack>
        <Stack
          spacing={1}
        >
          <Typography variant="subtitle1">Network Information</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={useWifi}
                onChange={(_e, checked) => setUseWifi(checked)}
              />
            }
            label={"Use WiFi"}
            labelPlacement="start"
            sx={{
              width: "fit-content"
            }}
          />
          {
            useWifi
              ? <Stack
                direction={"row"}
                spacing={2}
                width={"100%"}
              >
                <TextField
                  label={"WiFi SSID"}
                  fullWidth
                  required={useWifi}
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                />
                <TextField
                  label={"WiFi Password"}
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Stack>
              : null
          }
        </Stack>
        <Stack direction={"row"} justifyContent={"end"} width={"100%"} spacing={1}>
          <Button
            variant="contained"
            color="success"
            disabled={!allowPair}
            onClick={handlePair}
          >
            Pair
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleClose}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </PrettyModal>
  );
}