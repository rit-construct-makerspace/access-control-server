import { ChangeEvent, useEffect, useState } from "react";
import { Box, Button, Card, Checkbox, Collapse, Divider, FormControlLabel, FormGroup, IconButton, LinearProgress, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";
import { useLocation, useNavigate } from "react-router-dom";
import { endOfDay, parse, startOfDay } from "date-fns";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMore from "@mui/icons-material/ExpandMore";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useIsMobile } from "../../common/IsMobileProvider";
import SearchBar from "../../common/SearchBar";
import AuditLogRow from "../lab_management/audit_logs/AuditLogRow";
import { ManualRoomSignInModal } from "../lab_management/audit_logs/ManualRoomSignInModal";
import { useMakeTheme } from "../../common/MakeThemeProvider";

const GET_LOGS = gql`
  query GetLogs(
    $startDate: DateTime
    $stopDate: DateTime
    $searchText: String
    $filters: Filters
  ) {
    auditLogs(
      startDate: $startDate
      stopDate: $stopDate
      searchText: $searchText
      filters: $filters
    ) {
      id
      dateTime
      message
      category
      makerspaceID
    }
  }
`;

interface Filters {
  errors: string
  welcome: boolean
  auth: boolean
  status: boolean
  state: boolean
  help: boolean
  message: boolean
  server: boolean
  training: boolean
  admin: boolean
  uncategorized: boolean
}

function parseDateForQuery(
  dateString: string,
  dayShifter: (d: Date) => Date
): Date | null {
  if (!dateString) return null;
  return dayShifter(parse(dateString, "yyyy-MM-dd", new Date()));
}

export default function AdminHistoryPage() {
  const isMobile = useIsMobile();

  const { search } = useLocation();
  const navigate = useNavigate();
  const makeTheme = useMakeTheme();

  const [query, queryResult] = useLazyQuery(GET_LOGS, { pollInterval: 2000 });
  const [searchText, setSearchText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [manualSignInModal, setManualSignInModal] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const [filters, setFilters] = useState<Filters>({
    errors: localStorage.getItem("errors") ?? "both",
    welcome: localStorage.getItem("welcome") === "1",
    auth: localStorage.getItem("auth") === "1",
    status: localStorage.getItem("status") === "1",
    state: localStorage.getItem("state") === "1",
    help: localStorage.getItem("help") === "1",
    message: localStorage.getItem("message") === "1",
    server: localStorage.getItem("server") === "1",
    training: localStorage.getItem("training") === "1",
    admin: localStorage.getItem("admin") === "1",
    uncategorized: localStorage.getItem("uncategorized") === "1"
  });

  function handleAdvSearchChange(e: any, property: string) {
    setFilters({ ...filters, [property]: !(filters[property as keyof typeof filters]) });
    localStorage.setItem(property, (!(filters[property as keyof typeof filters]) ? "1" : "0"));
    setUrlParam(property, (!(filters[property as keyof typeof filters]) ? "1" : "0"));
  }

  function handleErrorSwitchChange(e: any) {
    setFilters({ ...filters, errors: e.target.value });
    localStorage.setItem("errors", e.target.value);
    setUrlParam("errors", e.target.value);
  }

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
        filters: filters
      },
    });
  }, [search, query, filters]);

  const setUrlParam = (paramName: string, paramValue: string) => {
    const params = new URLSearchParams(search);
    params.set(paramName, paramValue);
    navigate(`/admin/history?` + params, { replace: true });
  };

  const handleDateChange =
    (paramName: string, setter: (s: string) => void) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        setUrlParam(paramName, e.target.value);
      };

  const handleClear = () => {
    setSearchText("");
    navigate(`/admin/history`, { replace: true });
  };

  const showClearButton = startDateString || stopDateString || search.includes("q=");

  const logs = queryResult.data ? queryResult.data.auditLogs : undefined;
  return (
    <Box margin="25px">
      <title>{`History | ${makeTheme.title}`}</title>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography variant="h4">History</Typography>
        <Button startIcon={<PersonAddIcon />} color="secondary" onClick={() => setManualSignInModal(true)}>Manual Room Sign-in</Button>
      </Stack>
      <Stack direction={isMobile ? "column" : "row"} spacing={2}>
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
          hideClearButton
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSubmit={() => setUrlParam("q", searchText)}
        />

        {showClearButton && (
          <IconButton onClick={handleClear} sx={{ ml: "8px !important" }}>
            <CloseIcon />
          </IconButton>
        )}
        <Button onClick={(_e) => setUrlParam("q", searchText)} variant="contained" color="primary">Search</Button>
      </Stack>
      <Card sx={{ p: "1em", background: 'none', border: 'none' }}>
        <Stack direction={"row"} onClick={handleExpandClick}>
          <ExpandMore
            aria-expanded={expanded}
            aria-label="Advanced Options"
          ></ExpandMore>
          <Typography>
            Advanced Options
          </Typography>
        </Stack>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Stack direction={"column"}>
            <FormGroup>
              <Typography>
                Type
              </Typography>
              <Stack direction={"column"} flexWrap={isMobile ? "nowrap" : "wrap"} height={isMobile ? "auto" : "12.5em"}>
                <FormControlLabel
                  label="Sign-In Attempts"
                  control={<Checkbox checked={filters.welcome} onChange={(e) => handleAdvSearchChange(e, "welcome")} />}
                />
                <FormControlLabel
                  label="Equipment Activation Attempts"
                  control={<Checkbox checked={filters.auth} onChange={(e) => handleAdvSearchChange(e, "auth")} />}
                />
                <FormControlLabel
                  label="ACS Status Reports"
                  control={<Checkbox checked={filters.status} onChange={(e) => handleAdvSearchChange(e, "status")} />}
                />
                <FormControlLabel
                  label="ACS State Changes"
                  control={<Checkbox checked={filters.state} onChange={(e) => handleAdvSearchChange(e, "state")} />}
                />
                <FormControlLabel
                  label="Help Requests"
                  control={<Checkbox checked={filters.help} onChange={(e) => handleAdvSearchChange(e, "help")} />}
                />
                <FormControlLabel
                  label="ACS Messages"
                  control={<Checkbox checked={filters.message} onChange={(e) => handleAdvSearchChange(e, "message")} />}
                />
                <FormControlLabel
                  label="Server Messages"
                  control={<Checkbox checked={filters.server} onChange={(e) => handleAdvSearchChange(e, "server")} />}
                />
                <FormControlLabel
                  label="Admin Actions"
                  control={<Checkbox checked={filters.admin} onChange={(e) => handleAdvSearchChange(e, "admin")} />}
                />
                <FormControlLabel
                  label="Training Submissions"
                  control={<Checkbox checked={filters.training} onChange={(e) => handleAdvSearchChange(e, "training")} />}
                />
                <FormControlLabel
                  label="Uncategorized"
                  control={<Checkbox checked={filters.uncategorized} onChange={(e) => handleAdvSearchChange(e, "uncategorized")} />}
                />
              </Stack>
            </FormGroup>
            <FormGroup>
              <ToggleButtonGroup value={filters.errors} onChange={handleErrorSwitchChange} exclusive={true} size="small" aria-label="Small sizes" orientation={isMobile ? "vertical" : "horizontal"}>
                <ToggleButton value="no-errors" key="no-errors">
                  No Errors
                </ToggleButton>
                <ToggleButton value="both" key="both">
                  Both
                </ToggleButton>
                <ToggleButton value="only-errors" key="only-errors">
                  Only Errors
                </ToggleButton>
              </ToggleButtonGroup>
            </FormGroup>
          </Stack>
        </Collapse>
      </Card>
      {
        logs === undefined
          ? <LinearProgress />
          : (logs.length === 0)
            ? <Typography
              variant="body1"
              sx={{
                fontStyle: "italic",
                color: "grey.700",
                mx: "auto",
                my: 8,
              }}
            >
              No results.
            </Typography>
            : <Stack divider={<Divider flexItem />} mt={4} spacing={0.75}>
              {logs.map((log: any) => (
                <AuditLogRow
                  key={log.id}
                  dateTime={log.dateTime}
                  message={log.message}
                  category={log.category}
                  makerspaceID={log.makerspaceID}
                />
              ))}
              <Typography variant="body2">This page is limitted to 100 logs. Consider narrowing your search criteria.</Typography>
            </Stack>
      }

      <ManualRoomSignInModal modalOpen={manualSignInModal} setModalOpen={setManualSignInModal} />
    </Box>
  );
}
