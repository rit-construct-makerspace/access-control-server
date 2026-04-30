import { Button, Checkbox, Divider, FormControlLabel, LinearProgress, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import PrettyModal from "../../../common/PrettyModal";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { PAIR_CORE, PAIR_DISPENSER, PAIR_GENERIC_DEVICE } from "../../../queries/deviceQueries";

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

  const [paired, setPaired] = useState(false);

  const [pairGeneric, pairGenericResult] = useMutation(PAIR_GENERIC_DEVICE);
  const [pairCore, pairCoreResult] = useMutation(PAIR_CORE);
  const [pairDispenser, pairDispenserResult] = useMutation(PAIR_DISPENSER);

  const allowPair = device !== null && SN !== "" && ((useWifi && ssid !== "") || !useWifi) && !paired;

  async function handlePair() {
    const pairFunction = device === "generic" ? pairGeneric : device === "core" ? pairCore : pairDispenser;
    await pairFunction({
      variables: {
        SN: SN,
        makerspaceID: Number(makerspaceID)
      }
    });

    setPaired(true);
  }

  function handleClose() {
    setDevice(null);
    setSN("");
    setUseWifi(false);
    setSsid("");
    setPassword("");

    setPaired(false);

    props.onClose();
  }

  const pairedKey = useMemo(() => {
    switch (device) {
      case "generic":
        return pairGenericResult.data?.pairGenericDevice;
      case "core":
        return pairCoreResult.data?.pairCore;
      case "dispenser":
        return pairDispenserResult.data?.pairDispenser;
      default:
        return undefined;
    }
  }, [pairGenericResult.data, pairCoreResult.data, pairDispenserResult.data, device])

  return (
    <PrettyModal open={props.open} onClose={handleClose} width={"800px"}>
      <Stack width={"100%"} spacing={2}>
        <Typography variant="h4" textAlign={"center"}>Manually Pair Device</Typography>
        <Stack
          spacing={2}
        >
          <Typography variant="subtitle1">Hardware Identification</Typography>
          <ToggleButtonGroup
            value={device}
            onChange={(_e, newValue) => setDevice(newValue ?? null)}
            color="primary"
            exclusive
            disabled={paired}
          >
            <ToggleButton
              value={"generic"}
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
            disabled={paired}
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
                disabled={paired}
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
        <Divider orientation="horizontal" flexItem />
        {
          paired
            ? (pairedKey && (!pairGenericResult.loading || !pairDispenserResult.loading || !pairCoreResult.loading))
              ? <Typography>{
                JSON.stringify({
                  key: pairedKey,
                  wifi: useWifi ? {
                    ssid: ssid,
                    password: password
                  } : {
                    ssid: "",
                    password: ""
                  },
                  certCheckSum: ""
                }, undefined, 2)
              }</Typography>
              : <LinearProgress color="primary" />
            : null
        }
      </Stack>
    </PrettyModal>
  );
}