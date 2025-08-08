import React, { ReactNode, useEffect, useState } from "react";
import PrettyModal from "../../../common/PrettyModal";
import { Button, Divider, MenuItem, Select, Stack, TextareaAutosize, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import InventoryIcon from "@mui/icons-material/Inventory";
import { gql, useQuery } from "@apollo/client";
import { ShoppingCartEntry } from "./StorefrontPage";

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
  groupedEntries: Record<string, ShoppingCartEntry[]>;
  totalCost: string;
  onClose: () => void;
  onFinalize: (checkoutNotes: string) => void;
}

export default function CheckoutModal({
  open,
  onClose,
  groupedEntries,
  totalCost,
  onFinalize,
}: CheckoutModalProps) {
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
    <PrettyModal open={open} onClose={onClose} width={isMobile ? "100%" : 540}>
      <Stack spacing={2} px={2}>
        <Typography variant="h5">Checkout</Typography>
        <Divider />
        <Typography variant="body1">Review your items before checking out:</Typography>
        {Object.entries(groupedEntries).map(([makerspaceID, entries]) => (
          <Stack key={makerspaceID} spacing={1}>
            <Typography variant="h6">{entries[0].item.makerspace?.name || "Unknown Makerspace"}</Typography>
            {entries.map((entry) => (
              <Stack direction={"row"} justifyContent={"space-between"} key={entry.id}>
                <Stack direction="row" spacing={2} alignItems="baseline">
                  <Typography variant="body1">{entry.item.name}</Typography>
                  <Typography variant="body2">({entry.count > 1 && (`${entry.item.pricePerUnit.toFixed(2)} `)}x {entry.count})</Typography>
                </Stack>
                <Typography variant="body1">${(entry.item.pricePerUnit * entry.count).toFixed(2)}</Typography>
              </Stack>
            ))}
          </Stack>
        ))}
        <Divider />
        <Stack direction="row" spacing={2} alignItems="baseline" justifyContent={"space-between"}>
          <Typography variant="h6">Total Cost:</Typography>
          <Typography variant="body1">${totalCost}</Typography>
        </Stack>

        <Typography variant="body2">
          The amount of <b>${totalCost}</b> will be charged to your Tiger Bucks account balance.<br />
          Please ensure you have sufficient funds before proceeding.
          To add or view funds, visit the <a href="https://tigerspend.rit.edu/" target="_blank" rel="noopener noreferrer">RIT Tiger Spend site</a>.<br />
          This transaction will be canceled if you do not have enough funds.<br /><br />
          <b>Pickup instructions will be shown after successful payment.</b>
        </Typography>


        <Stack direction="row" spacing={2} alignItems="flex-end" justifyContent={"flex-end"}>
          <Button variant="outlined" color="error" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={() => onFinalize("")}>
            Confirm Charge of ${totalCost}
          </Button>
        </Stack>
      </Stack>
    </PrettyModal>
  );
}
