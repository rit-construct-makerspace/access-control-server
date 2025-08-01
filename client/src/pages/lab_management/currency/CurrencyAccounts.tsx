import { Button, Card, Grid, Stack, Typography } from "@mui/material";
import gql from "graphql-tag";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { useLazyQuery, useQuery } from "@apollo/client";
import SearchBar from "../../../common/SearchBar";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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

type CurrencyAccountOwner = {
  username: string;
  displayName: string;
  userID: number | null;
  orgID: number | null;
}

type CurrencyAccount = {
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

  const setUrlParam = (paramName: string, paramValue: string) => {
    const params = new URLSearchParams(location.search);
    params.set(paramName, paramValue);
    navigate(`/makerspace/${makerspaceID}/currency?` + params, { replace: true });
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryString = searchParams.get("q") ?? "";

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
  })

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
            onClear={() => setUrlParam("q", "")}
            onSubmit={() => setUrlParam("q", searchText)}
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
                          <Typography><b>Credits:</b> {moneyForamtter.format(account.balance)}</Typography>
                        </Stack>
                        <Button color="secondary" sx={{ alignSelf: "flex-end" }}>
                          Manage
                        </Button>
                      </Stack>
                    </Card>
                  </Grid>
                );
              })
            }
          </Grid>
        </Stack>
      );
    }} />
  );
}