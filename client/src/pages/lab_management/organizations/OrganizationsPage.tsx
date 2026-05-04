import { Button, Card, Grid, IconButton, Stack, TextField, Typography } from "@mui/material";
import { useIsMobile } from "../../../common/IsMobileProvider";
import SearchBar from "../../../common/SearchBar";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import AddIcon from "@mui/icons-material/Add";
import PrettyModal from "../../../common/PrettyModal";
import CloseIcon from "@mui/icons-material/Close";
import { CurrencyAccount } from "../currency/CurrencyAccounts";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ThemedMarkdown from "../../../common/ThemedMarkdown";
import { toast } from "react-toastify";
import { SEARCH_ORGS_LIMIT, CREATE_ORG, EDIT_ORG_NOTES, DELETE_ORG } from "../../../queries/organizationQueries";
import { useMakeTheme } from "../../../common/MakeThemeProvider";

type Organization = {
  id: number;
  username: string;
  displayname: string;
  notes: string;
  account: CurrencyAccount;
};

export default function OrganizationsPage() {
  const isMobile = useIsMobile();
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const makeTheme = useMakeTheme();

  const [getOrganizations, getOrganizationsResult] = useLazyQuery(SEARCH_ORGS_LIMIT);
  const [createOrganization] = useMutation(CREATE_ORG, { refetchQueries: ["SearchOrganizationsLimit"] });
  const [editOrganizationNotes] = useMutation(EDIT_ORG_NOTES, { refetchQueries: ["SearchOrganizationsLimit"] });
  const [deleteOrganization] = useMutation(DELETE_ORG, { refetchQueries: ["SearchOrganizationsLimit"] });

  const [searchText, setSearchText] = useState("");
  const [openCreateNewOrg, setOpenCreateNewOrg] = useState(false);
  const [openEditOrgNotes, setOpenEditOrgNotes] = useState(false);

  const [username, setUsername] = useState("");
  const [displayname, setDisplayname] = useState("");
  const [notes, setNotes] = useState("");
  const [orgID, setOrgID] = useState<number>(0);

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

    createOrganization({ variables: { username: username, displayname: displayname, notes: notes } });
    handleExitCreateNewOrg();
  }
  function handleExitCreateNewOrg() {
    setUsername("");
    setDisplayname("");
    setNotes("");
    setOpenCreateNewOrg(false);
  }

  function handleOpenEditOrgNotes(org: Organization) {
    setOrgID(org.id);
    setNotes(org.notes);
    setOpenEditOrgNotes(true);
  }
  function handleEditedNotes() {
    editOrganizationNotes({
      variables: { orgID: orgID, notes: notes },
      onCompleted: () => {
        toast.success("Organization notes updated successfully");
        handleExitEditOrgNotes();
      },
      onError: (error) => {
        toast.error("Error updating organization notes: " + error.message);
      }
    });
  }
  function handleExitEditOrgNotes() {
    setOrgID(0);
    setNotes("");
    setOpenEditOrgNotes(false);
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
          <title>{`Organizations | ${makeTheme.title}`}</title>
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
            <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => setOpenCreateNewOrg(true)}>
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
                        {org.notes.length > 0 && (
                          <Stack direction={"column"} alignItems={"center"}>
                            <Typography fontWeight={"bold"}>Notes:</Typography>
                            <ThemedMarkdown>{org.notes}</ThemedMarkdown>
                          </Stack>
                        )}
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
                            color="primary"
                            startIcon={<EditIcon />}
                            sx={{ alignSelf: "center" }}
                            onClick={() => handleOpenEditOrgNotes(org)}
                          >
                            Edit Notes
                          </Button>

                          <Button
                            color="secondary"
                            sx={{ alignSelf: "flex-end" }}
                            onClick={() => {
                              navigate(`/makerspace/${makerspaceID}/currency?a=${org.username}&l=${org.username}`);
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
          {/* Create New Org Modal */}
          <PrettyModal open={openCreateNewOrg} onClose={handleExitCreateNewOrg} width={"400px"}>
            <Stack width={"100%"} spacing={2} alignItems={"center"}>
              <Stack direction={"row"} spacing={1} justifyContent={"space-between"} width={"100%"} alignItems={"center"}>
                <Typography variant="h5">Create new Organization</Typography>
                <IconButton color="error" onClick={handleExitCreateNewOrg}>
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
              <TextField
                label="Notes"
                fullWidth
                multiline
                minRows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Stack direction={"row"} justifyContent={"space-between"} width={"100%"}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleExitCreateNewOrg}
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
          </PrettyModal>

          {/* Edit Org Notes Modal */}
          <PrettyModal open={openEditOrgNotes} onClose={handleExitEditOrgNotes} width={"400px"}>
            <Stack width={"100%"} spacing={2} alignItems={"center"}>
              <Stack
                direction={"row"}
                spacing={1}
                justifyContent={"space-between"}
                width={"100%"}
                alignItems={"center"}
              >
                <Typography variant="h5">Edit Organization Notes</Typography>
                <IconButton color="error" onClick={handleExitEditOrgNotes}>
                  <CloseIcon />
                </IconButton>
              </Stack>
              <TextField
                label="Notes"
                fullWidth
                multiline
                minRows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Stack direction={"row"} justifyContent={"space-between"} width={"100%"}>
                <Button variant="contained" color="error" onClick={handleExitEditOrgNotes}>Cancel</Button>
                <Button variant="contained" color="success" onClick={handleEditedNotes}>Submit</Button>
              </Stack>
            </Stack>
          </PrettyModal>
        </Stack>
      );
    }} />
  );
}
