import React, { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Collapse,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import InventoryItem from "../../../types/InventoryItem";
import PrettyModal from "../../../common/PrettyModal";

interface AddToCartModalProps {
  open: boolean;
  count: number;
  setCount: (count: number) => void;
  addToCart: () => void;
  onClose: () => void;
  item: InventoryItem;
}

export default function AddToCartModal({
  open,
  count,
  setCount,
  addToCart,
  onClose,
  item,
}: AddToCartModalProps) {
  const cost = count * item.pricePerUnit || 0;

  const validCost = cost > 0;
  const enoughInInventory = count <= item.count;

  const tryAddToCart = () => {
    if (!validCost || !enoughInInventory) return;

    addToCart();
    onClose();
  };

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
    <PrettyModal open={open} onClose={onClose} width={isMobile ? 250 : 400}>
      <Stack direction={"column"}>
        <Typography variant="h5" component="div" sx={{ mb: 2 }}>
          Add to shopping cart
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center" mb={4}>
          <Avatar alt="" src={item.image} />

          <Typography variant="body1" fontWeight={500}>
            {item.name}
          </Typography>
        </Stack>

        <Stack
          alignSelf="flex-end"
          alignItems="flex-end"
          width="min-content"
          mb={2}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <TextField
              label="Count"
              size="small"
              sx={{ width: 100 }}
              type="number"
              autoFocus
              slotProps={{ htmlInput: { min: 0, max: item.count } }}
              onKeyDown={({ key }) => {
                if (key === "Enter") tryAddToCart();
              }}
              onChange={(e) => {
                setCount(parseInt(e.target.value));
              }}
            />
            <Typography variant="body1">{item.pluralUnit}</Typography>
          </Stack>

          <Typography variant="body1" mt={1}>
            x ${item.pricePerUnit.toFixed(2)} per {item.unit}
          </Typography>

          <Divider flexItem sx={{ my: 1 }} />

          <Typography variant="h6" component="div">
            ${cost.toFixed(2)}
          </Typography>
        </Stack>

        <Collapse in={!enoughInInventory}>
          <Alert severity="error">
            Only {item.count} {item.pluralUnit} left in inventory
          </Alert>
        </Collapse>

        <Button
          variant="contained"
          sx={{ alignSelf: "flex-end", mt: 2 }}
          disabled={!validCost || !enoughInInventory}
          onClick={tryAddToCart}
        >
          Add to cart
        </Button>
      </Stack>
    </PrettyModal>
  );
}
