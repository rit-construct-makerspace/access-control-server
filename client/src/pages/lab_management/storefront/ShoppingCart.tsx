import React, { useState } from "react";
import { ShoppingCartEntry } from "./StorefrontPage";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { Button, Divider, Stack, Typography } from "@mui/material";
import ShoppingCartRow from "./ShoppingCartRow";
import CheckoutModal from "./CheckoutModal";
import EmptyPageSection from "../../../common/EmptyPageSection";
import UseModal from "./InternalUseModal";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { Box } from "@mui/system";

interface ShoppingCartProps {
  entries: ShoppingCartEntry[];
  removeEntry: (id: string) => void;
  setEntryCount: (id: string, newCount: number) => void;
  emptyCart: (checkoutNotes: string, recievingUserID?: number) => void;
  internal: boolean;
}

export default function ShoppingCart({
  entries,
  removeEntry,
  setEntryCount,
  emptyCart,
  internal,
}: ShoppingCartProps) {
  const isMobile = useIsMobile();

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const total = entries
    .reduce((acc, { count, item }) => acc + count * item.pricePerUnit, 0)
    .toFixed(2);


  const groupedEntries = entries.reduce((groups: Record<string, ShoppingCartEntry[]>, entry: ShoppingCartEntry) => {
    const key: number = entry.item.makerspaceID;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
    return groups;
  }, {});

  const groupedEntriesMapping = Object.entries(groupedEntries).map(([makerspaceID, entries]) => (
    <Box key={makerspaceID} sx={{ mb: 2 }}>
      <Typography variant="h6" component="div" sx={{ mb: 1 }}>
        {entries[0].item.makerspace?.name || "Unknown Makerspace"}
      </Typography>
      {entries.map((entry) => (
        <ShoppingCartRow
          key={entry.id}
          shoppingCartEntry={entry}
          removeEntry={() => removeEntry(entry.id)}
          setEntryCount={(newCount: number) =>
            setEntryCount(entry.id, newCount)
          }
        />
      ))}
    </Box>
  ));

  return (
    <>
      <Typography variant="h5" component="div" sx={{ mb: 2 }}>
        Cart
      </Typography>

      {entries.length === 0 && (
        <EmptyPageSection
          icon={<ShoppingCartIcon />}
          label="Cart empty."
        />
      )}

      <Stack spacing={1} divider={<Divider flexItem />}>
        {groupedEntriesMapping}
      </Stack>

      {entries.length > 0 && (
        <Stack
          spacing={1}
          sx={{ width: 150, ml: "auto", mt: isMobile ? 2 : 0, alignItems: "flex-start" }}
        >
          <Typography variant="h6" component="div">
            ${total}
          </Typography>
          <Button
            variant="contained"
            color={internal ? "warning" : "primary"}
            onClick={() => setShowCheckoutModal(true)}
            sx={{minWidth: "150px"}}
            // disabled = {import.meta.env.VITE_DISABLE_STORE_CHECKOUT === "true"}
          >
            {internal ? "Use" : "Checkout"}
          </Button>
        </Stack>
      )}

      {internal
      ? <UseModal
        open={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onFinalize={(checkoutNotes: string, recievingUserID: number | undefined) => {
          setShowCheckoutModal(false);
          emptyCart(checkoutNotes, recievingUserID);
        }}
      />
      : <CheckoutModal
        open={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onFinalize={(checkoutNotes: string) => {
          setShowCheckoutModal(false);
          emptyCart(checkoutNotes);
        }}
        groupedEntries={groupedEntries}
        totalCost={total}
      />}
    </>
  );
}
