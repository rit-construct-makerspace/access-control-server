import { Button, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import PrettyModal from "../../../common/PrettyModal";
import { useState } from "react";
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { CurrencyAccount } from "./CurrencyAccounts";
import CloseIcon from '@mui/icons-material/Close';
import gql from "graphql-tag";
import { useMutation } from "@apollo/client/react";

interface ManageAccountModalProps {
  account: CurrencyAccount;
  open: boolean;
  onClose: () => void;
}

const ADJUST_ACCOUNT_CENTS = gql`
  mutation AdjustAccountBalanceCents($accountID: ID!, $amount: Int!, $description: String!) {
    adjustAccountBalanceCents(accountID: $accountID, amount: $amount, description: $description)
  }
`;

export default function ManageAccountModal(props: ManageAccountModalProps) {

  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");

  const moneyForamtter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const [adjustAcountBalanceCents] = useMutation(ADJUST_ACCOUNT_CENTS, { refetchQueries: ["CurrencyAccountsLimit", "CurrencyLedgerEntriesLimit"] });

  function handleClose() {
    setAmount(0);
    setDescription("");

    props.onClose();
  }

  async function handleAdjustment(rawDollars: number) {
    if (Number.isNaN(rawDollars)) {
      alert(`Invalid number {${rawDollars}} submitted`);
      return;
    }

    if (description === "") {
      alert("Description required!")
      return;
    }

    await adjustAcountBalanceCents({
      variables: {
        accountID: props.account.id,
        amount: Math.round(rawDollars * 100),
        description: description,
      }
    });

    handleClose();
  }

  return (
    <PrettyModal open={props.open} onClose={handleClose} width={"600px"}>
      <Stack spacing={2} width={"100%"} alignItems={"center"}>
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"} width={"100%"}>
          <Typography color="primary" fontWeight={"bold"} variant="h5">{props.account.owner.displayName} ({props.account.owner.username})</Typography>
          <IconButton color="error" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Stack direction={"row"} justifyContent={"space-around"} alignItems={"center"} width={"100%"}>
          <Typography fontWeight={"bold"}>Account {props.account.id}</Typography>
          <Typography><b>Credits:</b> {moneyForamtter.format(props.account.balance / 100)}</Typography>
        </Stack>
        <TextField
          label="Description"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <Stack direction={"row"} spacing={1} width={"100%"}>
          <Button color="error" variant="contained" onClick={() => (handleAdjustment(amount * -1))}>
            Deduct
          </Button>
          <TextField
            label="Amount"
            required
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.abs(Number(e.target.value)))}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoneyIcon />
                  </InputAdornment>
                ),
              },
            }}
            fullWidth
          />
          <Button color="success" variant="contained" onClick={() => handleAdjustment(amount)}>
            Add
          </Button>
        </Stack>
      </Stack>
    </PrettyModal>
  );
}