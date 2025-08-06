import { ReactNode, useEffect, useState } from "react";
import PrettyModal from "../../../common/PrettyModal";
import { Button, Stack, TextareaAutosize, Typography } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";

function StepNumber({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="h1"
      component="div"
      sx={{
        color: "primary.main",
        fontWeight: 700,
        width: "54px",
      }}
    >
      {children}
    </Typography>
  );
}

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onFinalize: (checkoutNotes: string, recievingUserID: number | undefined) => void;
}

export default function UseModal({
  open,
  onClose,
  onFinalize,
}: CheckoutModalProps) {
  const [notes, setNotes] = useState("")

  function handleNotesChanged(e: any) {
    setNotes(e.target.value);
  }

  const [width, setWidth] = useState<number>(window.innerWidth);
  function handleWindowSizeChange() {
      setWidth(window.innerWidth);
  }
  useEffect(() => {
      window.addEventListener('resize', handleWindowSizeChange);
      return () => {
          window.removeEventListener('resize', handleWindowSizeChange);
      }
  }, []);
  const isMobile = width <= 1100;


  return (
    <PrettyModal open={open} onClose={onClose} width={isMobile ? 250 : 430}>
      <Stack spacing={2} px={2}>
        <Stack spacing={1}>
          <Typography variant="body1" fontWeight={"bold"}>
            Note: Internal Items should not be given or sold without staff approval.
          </Typography>
        </Stack>
      </Stack>

      <Stack sx={{p: 2}} direction="row" spacing={4} alignItems="center">
        <Stack spacing={1}>
          <Typography variant="body1">Add a note below to describe how/where the items are being used and then click <b>Update Inventory</b>.</Typography>
          <TextareaAutosize
            style={{ background: "none", fontFamily: "Roboto", fontSize: "1em", lineHeight: "2em", marginTop: "2em", marginBottom: "2em" }}
            aria-label="Notes"
            defaultValue={notes ?? ""}
            placeholder="Usage Notes"
            value={notes}
            onChange={handleNotesChanged} />
          <Button
            variant="outlined"
            startIcon={<InventoryIcon />}
            onClick={() => onFinalize(notes, undefined)}
          >
            Update inventory
          </Button>
        </Stack>
      </Stack>
    </PrettyModal >
  );
}
