import { Button, Card, Grid, Stack, Typography } from "@mui/material";
import gql from "graphql-tag";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { useLazyQuery } from "@apollo/client/react";
import SearchBar from "../../../common/SearchBar";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ManageAccountModal from "./ManageAccountModal";

const GET_CURRENCY_ACCOUNTS_LIMIT = gql`
  query CurrencyAccountsLimit($searchText: String) {
    currencyAccountsLimit(searchText: $searchText) {
      id
      balance
      owner {
        username
        displayName
        userID
        orgID
      }
    }
  }
`;

export type CurrencyAccountOwner = {
  username: string;
  displayName: string;
  userID: number | null;
  orgID: number | null;
}

export type CurrencyAccount = {
  id: number;
  balance: number;
  owner: CurrencyAccountOwner;
}

export default function CurrencyAccounts() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [getCurrencyAccounts, currencyAccountsResult] = useLazyQuery(GET_CURRENCY_ACCOUNTS_LIMIT);

  const [searchText, setSearchText] = useState("");
  const [account, setAccount] = useState<CurrencyAccount | null>(null);
  const [open, setOpen] = useState(false);

  const setUrlParam = (paramName: string, paramValue: string) => {
    const params = new URLSearchParams(location.search);
    params.set(paramName, paramValue);
    navigate(`/makerspace/${makerspaceID}/currency?` + params, { replace: true });
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryString = searchParams.get("a") ?? "";

    setSearchText(queryString);

    getCurrencyAccounts({
      variables: {
        searchText: queryString,
      },
    });
  }, [location.search, getCurrencyAccounts]);

  const moneyForamtter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <RequestWrapper2 result={currencyAccountsResult} render={(data) => {

      const accounts: CurrencyAccount[] = data.currencyAccountsLimit;

      return (
        <Stack spacing={2}>
          <SearchBar
            placeholder="Search Accounts"
            sx={{ maxWidth: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onClear={() => setUrlParam("a", "")}
            onSubmit={() => setUrlParam("a", searchText)}
          />
          <Grid container spacing={2} justifyContent={"center"}>
            {
              accounts.map((account: CurrencyAccount) => {

                return (
                  <Grid>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <Stack padding={"10px"} width={"350px"} height={"100%"} justifyContent={"space-between"} alignItems={"center"}>
                        <Typography color="primary" fontWeight={"bold"}>{account.owner.displayName} ({account.owner.username})</Typography>
                        <Stack direction={"row"} justifyContent={"space-around"} alignItems={"center"} width={"100%"}>
                          <Typography><b>Account ID:</b> {account.id}</Typography>
                          <Typography><b>Credits:</b> {moneyForamtter.format(account.balance / 100)}</Typography>
                        </Stack>
                        <Button
                          color="secondary"
                          sx={{ alignSelf: "flex-end" }}
                          onClick={() => {
                            setAccount(account);
                            setOpen(true);
                          }}
                        >
                          Manage
                        </Button>
                      </Stack>
                    </Card>
                  </Grid>
                );
              })
            }
          </Grid>
          {
            account &&
            <ManageAccountModal account={account} open={open} onClose={() => setOpen(false)} />
          }
        </Stack>
      );
    }} />
  );
}