import { Box, Button, Checkbox, FormControlLabel, Typography } from "@mui/material";
import PrettyModal from "../../../../common/PrettyModal";
import { CartItemCountState } from "./CartPage";
import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { GET_CART, SUBTRACT_ITEM_FROM_CART } from "../../../../queries/cartQueries";

interface PrettyModalProps {
  open: boolean;
  onClose: (failure?: boolean) => void;
  statedItem: CartItemCountState | null;
  cartId: number;
}

export function RefundModal({ open, onClose, statedItem, cartId }: PrettyModalProps) {
  const [restock, setRestock] = useState(false);

  const [subtractItemFromCart, subtractItemFromCartResult] = useMutation(SUBTRACT_ITEM_FROM_CART, { refetchQueries: [{ query: GET_CART, variables: { id: cartId } }] });

  if (!statedItem) {
    return null; // If no item is selected, do not render the modal
  }

  return (
    <PrettyModal open={open} onClose={onClose}>
      <Typography variant="h6">Update Item Cart Count ({statedItem.name})</Typography>
      <Box>
        <Typography variant="body2">Current Count: {statedItem.cartcount}</Typography>
        <Typography variant="body2">New Count: {statedItem.newCartcount}</Typography>
        <Typography variant="body1" fontWeight={"bold"}>The user will be refunded ${(statedItem.cartcount - statedItem.newCartcount) * statedItem.pricePerUnit}.</Typography>
      </Box>
      <Box>
        <FormControlLabel control={<Checkbox checked={restock} onChange={(e) => setRestock(e.target.checked)} />} label={`Restock ${statedItem.cartcount - statedItem.newCartcount} ${statedItem.pluralUnit} to Inventory?`} />
      </Box>

      <Button variant="contained" color="success" loading={subtractItemFromCartResult.loading} onClick={() => {
        subtractItemFromCart({
          variables: {
            cartID: cartId,
            itemID: statedItem.id,
            quantity: statedItem.cartcount - statedItem.newCartcount,
            restock
          }
        }).then(() => {
          onClose();
        }).catch(() => {
          onClose(true);
        });
      }}>
        Confirm Refund {restock && " & Restock"}
      </Button>
    </PrettyModal>
  )
}