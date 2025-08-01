import { Stack, Typography } from "@mui/material";
import CurrencyAccounts from "./CurrencyAccounts";


export default function CurrencyPage() {

  return (
    <Stack padding={"0 10px"} spacing={2}>
      <title>Currency | Make @ RIT</title>
      <Typography variant="h5">Currency Accounts</Typography>
      <CurrencyAccounts />
      <Typography variant="h5">Currency Ledger</Typography>
    </Stack>
  );
}