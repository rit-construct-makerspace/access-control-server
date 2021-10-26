import React from "react";
import {
  Avatar,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ShoppingCartEntry } from "./StorefrontPage";
import CloseIcon from "@mui/icons-material/Close";

interface ShoppingCartRowProps {
  shoppingCartEntry: ShoppingCartEntry;
  removeEntry: () => void;
  setEntryCount: (newCount: number) => void;
}

export default function ShoppingCartRow({
  shoppingCartEntry,
  removeEntry,
  setEntryCount,
}: ShoppingCartRowProps) {
  const { item, count } = shoppingCartEntry;

  return (
    <Stack direction="row" alignItems="center">
      <Stack direction="row" spacing={2} flexGrow={1} alignItems="center">
        <IconButton size="small" sx={{ ml: -1 }} onClick={removeEntry}>
          <CloseIcon />
        </IconButton>

        <Avatar alt="" src={item.image} sx={{ width: 24, height: 24 }} />

        <Typography variant="body1" fontWeight={500}>
          {item.name}
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1}>
        <TextField
          value={count}
          type="number"
          size="small"
          sx={{ width: 100 }}
          onChange={(e) => setEntryCount(parseInt(e.target.value))}
        />

        <Typography variant="body1" width={100}>
          {count === 1 ? item.unit : item.pluralUnit}
        </Typography>
      </Stack>

      <Typography variant="body1" width={150} ml={8}>
        ${(count * item.pricePerUnit).toFixed(2)}
      </Typography>
    </Stack>
  );
}
