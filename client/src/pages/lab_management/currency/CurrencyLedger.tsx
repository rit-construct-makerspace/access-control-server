import { useLazyQuery } from "@apollo/client";
import { Divider, Stack, Typography } from "@mui/material";
import gql from "graphql-tag";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SearchBar from "../../../common/SearchBar";
import RequestWrapper2 from "../../../common/RequestWrapper2";

const GET_CURRENCY_LEDGER_ENTRIES = gql`
  query CurrencyLedgerEntriesLimit($searchText: String) {
    currencyLedgerEntriesLimit(searchText: $searchText) {
      id
      dateTime
      accountID
      amount
      source
      description
      atxID
      refID
    }
  }
`;

type CurrencyLedgerEntry = {
  id: number;
  dateTime: Date;
  accountID: number;
  amount: number;
  source: string
  description: string | null
  atxID: number | null
  refID: number | null
}

export default function CurrencyLedger() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [getLedgerEntries, ledgerEntriesResults] = useLazyQuery(GET_CURRENCY_LEDGER_ENTRIES);

  const [searchText, setSearchText] = useState("");

  const setUrlParam = (paramName: string, paramValue: string) => {
    const params = new URLSearchParams(location.search);
    params.set(paramName, paramValue);
    navigate(`/makerspace/${makerspaceID}/currency?` + params, { replace: true });
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryString = searchParams.get("a") ?? "";

    setSearchText(queryString);

    getLedgerEntries({
      variables: {
        searchText: queryString,
      },
    });
  }, [location.search, getLedgerEntries]);

  const moneyForamtter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  })

  const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <RequestWrapper2 result={ledgerEntriesResults} render={(data) => {

      const entries: CurrencyLedgerEntry[] = data.currencyLedgerEntriesLimit;

      return (
        <Stack spacing={2} divider={<Divider orientation="horizontal" flexItem />}>
          <SearchBar
            placeholder="Search Ledger"
            sx={{ maxWidth: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onClear={() => setUrlParam("l", "")}
            onSubmit={() => setUrlParam("l", searchText)}
          />
          {
            entries.map((entry) => (
              <Stack direction={"row"} justifyContent={"space-between"}>
                <Typography>ID: {entry.id}</Typography>
                <Typography>Account: {entry.accountID}</Typography>
                <Typography>{dateTimeFormatter.format(new Date(entry.dateTime))}</Typography>
                <Typography>Source: {entry.source}</Typography>
                <Typography>Description: {entry.description}</Typography>
                <Typography>ATX ID: {entry.atxID}</Typography>
                <Typography>REF ID: {entry.refID}</Typography>
              </Stack>
            ))
          }
        </Stack>
      );
    }} />
  );
}