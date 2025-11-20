import { InputAdornment, TextField, Typography } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';




import { gql, useLazyQuery } from "@apollo/client";
import { PartialUser, PARTIAL_USER_FRAGMENT } from "../../../queries/userQueries";
import CardReaderModal from "./internal/CardReaderModal";

interface CardLookupResponse {
  user: PartialUser,
  tigerBucksCents: number,
  creditsCents: number,
}

const USER_FROM_UNIVIERSITY_ID_CARD_TAP = gql`
  query UserDataFromUniversityIDCardTap($uid: String!) {
    userDataFromUniversityIDCardTap(uid: $uid) {
      user {
        ...PartialUserFragment
      }
      tigerBucksCents
      creditsCents
    }
  }
  ${PARTIAL_USER_FRAGMENT}
`;


export default function CheckoutPage() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');


  const [loadUser, loadUserResult] = useLazyQuery(USER_FROM_UNIVIERSITY_ID_CARD_TAP)

  function lookupUid(uid: string) {
    loadUser({ variables: { uid: uid } });
  }
  function cancel() {
    navigate(-1);
  }

  function chargePage(data: CardLookupResponse) {
    const moneyFormatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    });

    return <Box  alignItems={"center"}>
      <Stack
        direction="column"
        alignItems={"center"}
        justifySelf={"center"}
        maxWidth={"75vw"}
      >
        <Typography variant="h4">Charging {data.user.firstName} {data.user.lastName} ({data.user.ritUsername})</Typography>
        <Stack direction={"row"} spacing={"10px"}>
          <Box boxShadow={1} padding={"4px"}>Tigerbucks: {moneyFormatter.format(data.tigerBucksCents / 100)}</Box>
          <Box boxShadow={1} padding={"4px"}>Construct Credit: {moneyFormatter.format(data.creditsCents / 100)}</Box>
          <Box boxShadow={1} padding={"4px"}>Total: {moneyFormatter.format((data.tigerBucksCents + data.creditsCents) / 100)}</Box>
        </Stack>
        <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

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

      </Stack>
    </Box>

  }

  return <Box margin="10px 25px">
    {(loadUserResult?.data?.userDataFromUniversityIDCardTap)
      ? chargePage(loadUserResult?.data?.userDataFromUniversityIDCardTap)
    : undefined
    }

    <CardReaderModal open={loadUserResult?.data?.userDataFromUniversityIDCardTap == undefined} loading={loadUserResult?.loading} failed={loadUserResult.data != undefined && !loadUserResult.loading} onSubmit={lookupUid} onCancel={cancel} />
  </Box>
}