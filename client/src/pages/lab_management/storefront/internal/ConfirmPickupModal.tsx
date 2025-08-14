import { Typography, Button } from "@mui/material";
import { Box, Stack } from "@mui/system";
import PrettyModal from "../../../../common/PrettyModal";

interface PickupModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmPickupModal({ open, onClose, onConfirm }: PickupModalProps) {
  if (!open) return null;

  return (
    <PrettyModal open={open} onClose={onClose}>
      <Typography variant="h6">Confirm Item Pickup</Typography>
      <Box>
        <Typography variant="body1">Confirm completion of pickup?</Typography>
        <Typography variant="body2" fontWeight={"bold"}>This action cannot be undone. Only confirm once the user has picked up all the items listed in this cart.</Typography>
      </Box>
      <Stack direction={"row"}>
        <Button variant="outlined" color="info" onClick={onClose}>
          Close
        </Button>
        <Button variant="contained" color="success" onClick={onConfirm}>
          Confirm Pickup
        </Button>
      </Stack>
    </PrettyModal>
  );
}