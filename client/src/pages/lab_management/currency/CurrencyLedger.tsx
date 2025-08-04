import { useLazyQuery } from "@apollo/client";
import { Divider, Stack, Typography } from "@mui/material";
import gql from "graphql-tag";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SearchBar from "../../../common/SearchBar";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { DataGrid, GridRowsProp, GridColDef } from '@mui/x-data-grid';

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
    const queryString = searchParams.get("l") ?? "";

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
  });

  return (
    <RequestWrapper2 result={ledgerEntriesResults} render={(data) => {

      const entries: CurrencyLedgerEntry[] = data.currencyLedgerEntriesLimit;

      const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 100 },
        { field: "accountID", headerName: "Account ID", width: 150 },
        { field: "amount", headerName: "Amount", width: 200 },
        { field: "dateTime", headerName: "Date", width: 200 },
        { field: "source", headerName: "Source", width: 200 },
        { field: "description", headerName: "Description", width: 500 },
        { field: "atxID", headerName: "ATX ID", width: 150 },
        { field: "refID", headerName: "REF ID", width: 150 },
      ];

      const rows: GridRowsProp = entries.map((entry) => ({
        id: entry.id,
        accountID: entry.accountID,
        amount: moneyForamtter.format(entry.amount / 100),
        dateTime: dateTimeFormatter.format(new Date(entry.dateTime)),
        source: entry.source,
        description: entry.description,
        atxID: entry.atxID,
        refID: entry.refID,
      }))

      return (
        <Stack spacing={2}>
          <SearchBar
            placeholder="Search Ledger"
            sx={{ maxWidth: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onClear={() => setUrlParam("l", "")}
            onSubmit={() => setUrlParam("l", searchText)}
          />
          <DataGrid rows={rows} columns={columns} />
        </Stack>
      );
    }} />
  );
}