import React, { useState } from "react";
import { ShoppingCartEntry } from "./StorefrontPage";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { Button, Divider, Stack, Typography } from "@mui/material";
import ShoppingCartRow from "./ShoppingCartRow";
import CheckoutModal from "./CheckoutModal";
import EmptyPageSection from "../../../common/EmptyPageSection";
import UseModal from "./InternalUseModal";
import { useIsMobile } from "../../../common/IsMobileProvider";

interface ShoppingCartProps {
  entries: ShoppingCartEntry[];
  removeEntry: (id: string) => void;
  setEntryCount: (id: string, newCount: number) => void;
  emptyCart: (checkoutNotes: string, recievingUserID: number | undefined) => void;
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
        {entries.map((entry) => (
          <ShoppingCartRow
            shoppingCartEntry={entry}
            key={entry.id}
            removeEntry={() => removeEntry(entry.id)}
            setEntryCount={(newCount: number) =>
              setEntryCount(entry.id, newCount)
            }
          />
        ))}
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
        onFinalize={(checkoutNotes: string, recievingUserID: number | undefined) => {
          setShowCheckoutModal(false);
          emptyCart(checkoutNotes, recievingUserID);
        }}
      />}
    </>
  );
}
