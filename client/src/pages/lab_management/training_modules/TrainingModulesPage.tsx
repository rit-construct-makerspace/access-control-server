import { useEffect, useState } from "react";
import SearchBar from "../../../common/SearchBar";
import { Button, Divider, Stack, Typography } from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import TrainingModuleRow from "./TrainingModuleRow";
import { GET_TRAINING_MODULES } from "../../../queries/trainingQueries";
import { TrainingModule } from "../../../common/TrainingModuleUtils";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { isStaffFor } from "../../../common/PrivilegeUtils";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { useMakeTheme } from "../../../common/MakeThemeProvider";

export default function TrainingModulesPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const currentUser = useCurrentUser();
  const makeTheme = useMakeTheme();
  const { search } = useLocation();

  const getModuleResults = useQuery(GET_TRAINING_MODULES);

  const [searchText, setSearchText] = useState("");

  const handleNewModuleClicked = async () => {
    // Redirect to the module editor after creation
    navigate(`/makerspace/${makerspaceID}/training/new`);
  };

  const setUrlParam = (paramName: string, paramValue: string) => {
    const params = new URLSearchParams(search);
    params.set(paramName, paramValue);
    navigate(`/makerspace/${makerspaceID}/trainings?` + params, { replace: true });
  };
  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const queryString = searchParams.get("a") ?? "";

    setSearchText(queryString)
  }, [search]);

  return (
    <Stack margin="0 20px" spacing={2}>
      <title>{`Manage Trainings | ${makeTheme.title}`}</title>
      <Typography variant="h3">Manage Trainings</Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <SearchBar
          placeholder="Search training modules"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSubmit={() => setUrlParam("a", searchText)}
          onClear={() => setSearchText("")}
        />
        <Button
          loading={false}
          variant="outlined"
          startIcon={<CreateIcon />}
          onClick={handleNewModuleClicked}
          sx={{ height: 40 }}
        >
          New module
        </Button>
      </Stack>

      <RequestWrapper2 result={getModuleResults} render={(data) => {
        const rawModules: [TrainingModule] = data.modules;
        const allModules = rawModules.filter((tm) => (tm.name.toLowerCase().includes(searchText.toLowerCase()) && isStaffFor(currentUser, tm.makerspaceID ?? -1)));
        const activeModules = allModules.filter((tm) => !tm.archived);
        const archivedModules = allModules.filter((tm) => tm.archived);
        return (
          <Stack direction={isMobile ? "column" : "row"} justifyContent={"space-between"}>
            <Stack divider={<Divider orientation="horizontal" flexItem />} width={"48%"}>
              <Typography variant="h5" textAlign={"center"}>Active Modules</Typography>
              {
                activeModules.map((tm) => (
                  <TrainingModuleRow key={tm.id} module={tm} />
                ))
              }
            </Stack>
            <Stack divider={<Divider orientation="horizontal" flexItem />} width={"48%"}>
              <Typography variant="h5" textAlign={"center"}>Archived Modules</Typography>
              {
                archivedModules.map((tm) => (
                  <TrainingModuleRow key={tm.id} module={tm} />
                ))
              }
            </Stack>
          </Stack>
        );
      }}
      />
    </Stack>
  );
}
