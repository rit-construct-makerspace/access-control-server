import { ChangeEvent, useEffect, useState } from "react";
import { Box, Stack, styled, Table, TableCell, TableHead, TableRow, TextField } from "@mui/material";
import SearchBar from "../../../common/SearchBar";
import PageSectionHeader from "../../../common/PageSectionHeader";
import { useLazyQuery } from "@apollo/client/react";
import RequestWrapper from "../../../common/RequestWrapper";
import { GET_LEDGERS } from "../../../queries/inventoryQueries";
import AuditLogEntity from "../audit_logs/AuditLogEntity";
import { InventoryLedger } from "../../../types/InventoryItem";
import { endOfDay, format, parse, startOfDay } from "date-fns";
import { useLocation, useNavigate } from "react-router-dom";
import LedgerDeleteButton from "./LedgerDeleteButton";



export default function Ledger() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState<string>("");

  const [query, queryResult] = useLazyQuery(GET_LEDGERS);


  const matchingItems = queryResult.data?.Ledgers.filter((i: InventoryLedger) => {
    const searchString = i.category + " " + i.initiator?.firstName + " " + i.initiator?.lastName + " " + i.items.toString() + " " + i.purchaser?.firstName + " " + i.purchaser?.lastName + " " + i.totalCost + " ";
    return searchString.toLowerCase().includes(searchText.toLowerCase())
  });

  const [startDateString, setStartDateString] = useState("");
  const [stopDateString, setStopDateString] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const startDate = searchParams.get("start") ?? "";
    const stopDate = searchParams.get("stop") ?? "";
    const queryString = searchParams.get("q") ?? "";

    setStartDateString(startDate);
    setStopDateString(stopDate);
    setSearchText(queryString);

    query({
      variables: {
        startDate: parseDateForQuery(startDate, startOfDay),
        stopDate: parseDateForQuery(stopDate, endOfDay),
        searchText: queryString,
      },
    });
  }, [search, query]);

  const setUrlParam = (paramName: string, paramValue: string) => {
    const params = new URLSearchParams(search);
    params.set(paramName, paramValue);
    navigate("/admin/history?" + params, { replace: true });
  };

  const handleDateChange =
    (paramName: string, setter: (s: string) => void) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setUrlParam(paramName, e.target.value);
    };

  function parseDateForQuery(
    dateString: string,
    dayShifter: (d: Date) => Date
  ): Date | null {
    if (!dateString) return null;
    return dayShifter(parse(dateString, "yyyy-MM-dd", new Date()));
  }

    const StyledTableRow = styled(TableRow)(({ theme }) => ({
      '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
      },
    }));

  function incomeColor(totalCost: number): string | undefined {
    if (totalCost > 0) return "#cdffb955";
    if (totalCost < 0) return "#ffb9b955";
    return "#00000000";
  }

  return (
    <RequestWrapper loading={queryResult.loading} error={queryResult.error}>
      <Box>
        <PageSectionHeader>Ledger</PageSectionHeader>

        <Stack direction="row" alignItems="center" spacing={1}>
        <TextField
          label="Start"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={{ width: 180 }}
          value={startDateString}
          onChange={handleDateChange("start", setStartDateString)}
        />
        <TextField
          label="Stop"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={{ width: 180 }}
          value={stopDateString}
          onChange={handleDateChange("stop", setStopDateString)}
        />
          <SearchBar
            placeholder="Search ledger"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onClear={() => setSearchText("")}
          />
          {/* <Button
            variant="outlined"
            startIcon={<CreateIcon />}
            onClick={() => setModalItemId("new")}
            sx={{ height: 40 }}
          >
            New material
          </Button> */}
        </Stack>

        <Box sx={{width: "100%", overflowX: "scroll"}}>
          <Table sx={{ 'td': { p: 0 } }}>
            <TableHead>
              <TableCell sx={{width: "90px"}}>Timestamp</TableCell>
              <TableCell sx={{width: "100px"}}>Initiator</TableCell>
              <TableCell sx={{width: "80px"}}>Category</TableCell>
              <TableCell sx={{maxWidth: "100px"}}>Total Cost</TableCell>
              <TableCell sx={{minWidth: "180px"}}>Notes</TableCell>
              <TableCell sx={{width: "300px"}}>Items</TableCell>
              <TableCell sx={{width: "70px"}}>Actions</TableCell>
            </TableHead>
            {matchingItems && matchingItems.map((item: InventoryLedger) => (
              <StyledTableRow>
                <TableCell>{format(new Date(Number(item.timestamp)), "M/d/yy h:mmaaa")}</TableCell>
                <TableCell>
                  {item.initiator 
                    ? <AuditLogEntity entityCode={`user:${item.initiator.id}:${item.initiator.firstName} ${item.initiator.lastName}`} />
                    : <i>None</i>
                  }
                  </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell sx={{backgroundColor: incomeColor(item.totalCost)}}>$ {item.totalCost.toFixed(2)}</TableCell>
                <TableCell>{item.purchaser && <div><b>Purchased By: <AuditLogEntity entityCode={`user:${item.purchaser.id}:${item.purchaser.firstName} ${item.purchaser.lastName}`} /></b></div>}{item.notes}</TableCell>
                <TableCell>
                  <Table>
                    {item.items.map((subItem: {quantity: number, name: string}) => (
                      <TableRow>
                        <TableCell sx={{width: "5em", pr: "1em"}}>{subItem.quantity}x</TableCell>
                        <TableCell sx={{textAlign: "left", ml: "2em"}}>{subItem.name}</TableCell>
                      </TableRow>
                    ))}
                  </Table>
                </TableCell>
                <TableCell><LedgerDeleteButton itemID={item.id} /></TableCell>
              </StyledTableRow>
            ))}
          </Table>
          <p>Ledger is limited to 100 logs at once. Consider narrowing your search.</p>
        </Box>
      </Box>
    </RequestWrapper>
  );
}

