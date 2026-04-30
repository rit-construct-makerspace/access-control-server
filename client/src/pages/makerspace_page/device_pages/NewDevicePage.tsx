import { Alert, AlertTitle, Button, Skeleton, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ManualDevicePairModal from "./ManualDevicePairModal";
import { GET_SMALL_MAKERSPACE } from "../../../queries/makerspaceQueries";
import { useQuery } from "@apollo/client/react";

export default function NewDevicePage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const makerspaceResult = useQuery(GET_SMALL_MAKERSPACE, { variables: { id: Number(makerspaceID) } });

  const [deviceType, setDeviceType] = useState<"generic" | "core" | "dispenser" | null>(null);
  const [manualModal, setManualModal] = useState(false);

  const serialSupported = "serial" in navigator;

  useEffect(() => {
    console.log(makerspaceResult.data)
  }, [makerspaceResult.data])

  if (!serialSupported) {
    return (
      <Stack spacing={2} padding={"10px 15px"}>
        <title>Pair Device</title>
        <Typography variant="h3">{makerspaceResult.loading ? <Skeleton /> : `Pairing Device with ${makerspaceResult.data?.makerspaceByID.name ?? ""}`}</Typography>
        <Alert
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
        <ManualDevicePairModal open={manualModal} onClose={() => setManualModal(false)} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2} padding={"10px 15px"}>
      <title>Pair Device</title>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Typography variant="h3">{makerspaceResult.loading ? <Skeleton /> : `Pairing Device with ${makerspaceResult.data?.makerspaceByID.name ?? ""}`}</Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={() => setManualModal(true)}
        >
          Manually Pair Device
        </Button>
      </Stack>
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
      <ManualDevicePairModal open={manualModal} onClose={() => setManualModal(false)} />
    </Stack>
  );
}