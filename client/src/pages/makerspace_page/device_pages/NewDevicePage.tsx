import { Alert, AlertTitle, Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useState } from "react";
import { useParams } from "react-router-dom";
import ManualDevicePairModal from "./ManualDevicePairModal";

export default function NewDevicePage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const [deviceType, setDeviceType] = useState<"generic" | "core" | "dispenser" | null>(null);
  const [manualModal, setManualModal] = useState(false);

  const serialSupported = "serial" in navigator;

  return (
    <Stack spacing={2} padding={"10px 15px"}>
      <title>Pair Device</title>
      <Typography variant="h3">Pairing Device with</Typography>
      <Stack spacing={1}>
        <Typography variant="subtitle1">Device Type</Typography>
        <ToggleButtonGroup
          exclusive
          value={deviceType}
          onChange={(_e, newValue) => setDeviceType(newValue)}
          color="primary"
        >
          <ToggleButton
            value="generic"
            disabled
          >
            Generic
          </ToggleButton>
          <ToggleButton
            value="core"
          >
            Core
          </ToggleButton>
          <ToggleButton
            value="dispenser"
            disabled
          >
            Dispenser
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {
        serialSupported
          ? "Serial Supported :)"
          : <Alert
            variant="filled"
            severity="error"
            action={
              <Button
                color="inherit"
                onClick={() => setManualModal(true)}
              >
                MANUALLY PAIR DEVICE
              </Button>
            }
            sx={{
              whiteSpace: "pre-line"
            }}
          >
            <AlertTitle>WebSerial Unsupported</AlertTitle>
            {`The WebSerial API is unsupported in this browser.\nPlease switch to Chrome or Edge to streamline the device pairing process.`}
          </Alert>
      }
      <ManualDevicePairModal open={manualModal} onClose={() => setManualModal(false)} />
    </Stack>
  );
}