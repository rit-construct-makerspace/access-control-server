import { Button, Card, Grid, IconButton, Stack, TextField, Typography } from "@mui/material";
import { useIsMobile } from "../../../common/IsMobileProvider";
import SearchBar from "../../../common/SearchBar";
import gql from "graphql-tag";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import AddIcon from '@mui/icons-material/Add';
import PrettyModal from "../../../common/PrettyModal";
import CloseIcon from '@mui/icons-material/Close';
import { CurrencyAccount } from "../currency/CurrencyAccounts";
import DeleteIcon from '@mui/icons-material/Delete';

const SEARCH_ORGS_LIMIT = gql`
  query SearchOrganizationsLimit($searchText: String!) {
    searchOrganizationsLimit(searchText: $searchText) {
      id
      username
      displayname
      accountID
      account {
        id
        balance
      }
    }
  }
`;

const CREATE_ORG = gql`
  mutation CreateOrganization($username: String!, $displayname: String) {
    createOrganization(username: $username, displayname: $displayname) {
      id
    }
  }
`;

const DELETE_ORG = gql`
  mutation DeleteOrganization($orgID: ID!) {
    deleteOrganization(orgID: $orgID)
  }
`;

type Organization = {
  id: number;
  username: string;
  displayname: string;
  account: CurrencyAccount
}

export default function OrganizationsPage() {
  const isMobile = useIsMobile();
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [getOrganizations, getOrganizationsResult] = useLazyQuery(SEARCH_ORGS_LIMIT);
  const [createOrganization] = useMutation(CREATE_ORG, { refetchQueries: ["SearchOrganizationsLimit"] })
  const [deleteOrganization] = useMutation(DELETE_ORG, { refetchQueries: ["SearchOrganizationsLimit"] })

  const [searchText, setSearchText] = useState("");
  const [open, setOpen] = useState(false);

  const [username, setUsername] = useState("");
  const [displayname, setDisplayname] = useState("");

  const setUrlParam = (paramName: string, paramValue: string) => {
    const params = new URLSearchParams(location.search);
    params.set(paramName, paramValue);
    navigate(`/makerspace/${makerspaceID}/organizations?` + params, { replace: true });
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryString = searchParams.get("q") ?? "";

    setSearchText(queryString);

    getOrganizations({
      variables: {
        searchText: queryString,
      },
    });
  }, [location.search, getOrganizations]);

  function handleNewOrg() {
    if (username === "") {
      window.alert("Username cannot be blank");
      return;
    }

    createOrganization({ variables: { username: username, displayname: displayname } });
    handleExit();
  }

  function handleExit() {
    setUsername("");
    setDisplayname("");
    setOpen(false);
  }

  const moneyForamtter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <RequestWrapper2 result={getOrganizationsResult} render={(data) => {

      const organizations: Organization[] = data.searchOrganizationsLimit;

      return (
        <Stack spacing={2} margin={"10px 20px"}>
          <title>Organizations | Make @ RIT</title>
          <Stack direction={isMobile ? "column" : "row"} spacing={2}>
            <Typography variant="h4">Organizations</Typography>
            <SearchBar
              placeholder="Search Organizations"
              sx={{ maxWidth: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onClear={() => setUrlParam("q", "")}
              onSubmit={() => setUrlParam("q", searchText)}
            />
            <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
              New Organization
            </Button>
          </Stack>
          <Grid container spacing={2} justifyContent={"center"}>
            {
              organizations.map((org) => {

                return (
                  <Grid>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <Stack padding={"10px"} width={"350px"} height={"100%"} justifyContent={"space-between"} alignItems={"center"}>
                        <Typography color="primary" fontWeight={"bold"}>{org.displayname} ({org.username})</Typography>
                        <Stack direction={"row"} justifyContent={"space-around"} alignItems={"center"} width={"100%"}>
                          <Typography><b>Account ID:</b> {org.account.id}</Typography>
                          <Typography><b>Credits:</b> {moneyForamtter.format(org.account.balance / 100)}</Typography>
                        </Stack>
                        <Stack direction={"row"} justifyContent={"space-between"} width={"100%"}>
                          <Button
                            color="error"
                            startIcon={<DeleteIcon />}
                            disabled={org.account.balance !== 0}
                            onClick={() => deleteOrganization({ variables: { orgID: org.id } })}
                          >
                            Delete
                          </Button>

                          <Button
                            color="secondary"
                            sx={{ alignSelf: "flex-end" }}
                            onClick={() => {
                              navigate(`/makerspace/${makerspaceID}/currency?a=${org.username}`)
                            }}
                          >
                            View Account
                          </Button>
                        </Stack>
                      </Stack>
                    </Card>
                  </Grid>
                );
              })
            }
          </Grid>
          <PrettyModal open={open} onClose={handleExit} width={"400px"}>
            <Stack width={"100%"} spacing={2} alignItems={"center"}>
              <Stack direction={"row"} spacing={1} justifyContent={"space-between"} width={"100%"} alignItems={"center"}>
                <Typography variant="h5">Create new Organization</Typography>
                <IconButton color="error" onClick={handleExit}>
                  <CloseIcon />
                </IconButton>
              </Stack>

              <TextField
                label="Username"
                fullWidth
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                label="Display Name"
                fullWidth
                value={displayname}
                onChange={(e) => setDisplayname(e.target.value)}
              />
              <Stack direction={"row"} justifyContent={"space-between"} width={"100%"}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleExit}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleNewOrg}
                >
                  Submit
                </Button>
              </Stack>
            </Stack>
          </PrettyModal >
        </Stack >
      );
    }} />
  );
}