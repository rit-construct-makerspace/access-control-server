import { Stack, Typography } from "@mui/material";
import CurrencyAccounts from "./CurrencyAccounts";
import CurrencyLedger from "./CurrencyLedger";
import { useMakeTheme } from "../../../common/MakeThemeProvider";


export default function CurrencyPage() {
  const makeTheme = useMakeTheme();

  return (
    <Stack padding={"0 20px 15px"} spacing={2}>
      <title>{`Currency | ${makeTheme.title}`}</title>
      <Typography variant="h5">Currency Accounts</Typography>
      <CurrencyAccounts />
      <Typography variant="h5">Currency Ledger</Typography>
      <CurrencyLedger />
    </Stack>
  );
}