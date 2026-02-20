import { Button, Stack, TextField, Typography } from "@mui/material";
import PrettyModal from "../../../common/PrettyModal";

interface ManualDevicePairModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ManualDevicePairModal(props: ManualDevicePairModalProps) {

  function handleClose() {

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
          <TextField
            label={"Serial Number"}
            required
            fullWidth
          />
        </Stack>
        <Stack
          spacing={1}
        >
          <Typography variant="subtitle1">Network Information</Typography>
          <Stack
            direction={"row"}
            spacing={2}
            width={"100%"}
          >
            <TextField
              label={"WiFi SSID"}
              fullWidth
            />
            <TextField
              label={"WiFi Password"}
              fullWidth
            />
          </Stack>
        </Stack>
        <Stack direction={"row"} justifyContent={"end"} width={"100%"} spacing={1}>
          <Button
            variant="contained"
            color="success"
          >
            Pair
          </Button>
          <Button
            variant="contained"
            color="error"
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </PrettyModal>
  );
}