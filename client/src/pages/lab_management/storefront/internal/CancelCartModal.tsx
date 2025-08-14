import { Typography, Button } from "@mui/material";
import { Box, Stack } from "@mui/system";
import PrettyModal from "../../../../common/PrettyModal";

interface PickupModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelCartModal({ open, onClose, onConfirm }: PickupModalProps) {
  if (!open) return null;

  return (
    <PrettyModal open={open} onClose={onClose}>
      <Typography variant="h6">Confirm Item Pickup</Typography>
      <Box>
        <Typography variant="body1">Confirm cancellation of this cart?</Typography>
        <Typography variant="body2" fontWeight={"bold"}>This action cannot be undone. All items will be restocked to inventory, and a full refund will be sent to the consumer account.</Typography>
      </Box>
      <Stack direction={"row"}>
        <Button variant="outlined" color="info" onClick={onClose}>
          Close
        </Button>
        <Button variant="contained" color="error" onClick={onConfirm}>
          Confirm Cancellation
        </Button>
      </Stack>
    </PrettyModal>
  );
}