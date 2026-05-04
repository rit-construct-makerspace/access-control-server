import { useQuery } from "@apollo/client/react";
import { Button, Divider, FormControlLabel, Stack, Switch } from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FullMakerspace, GET_MAKERSPACE_BY_ID } from "../../queries/makerspaceQueries";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { useEffect, useState } from "react";
import RoomSection from "./RoomSection";
import Room from "../../types/Room";
import SearchBar from "../../common/SearchBar";
import StaffBar from "./StaffBar";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import AddIcon from '@mui/icons-material/Add';
import { useIsMobile } from "../../common/IsMobileProvider";
import { isManagerFor, isStaffFor } from "../../common/PrivilegeUtils";
import { moduleStatusMapper } from "../../common/TrainingModuleUtils";
import ExpandableHeader from "./ExpandableHeader";
import { useMakeTheme } from "../../common/MakeThemeProvider";

export default function MakerspacePage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const makeTheme = useMakeTheme();
  const { search } = useLocation();

  const getMakerspace = useQuery(GET_MAKERSPACE_BY_ID, { variables: { id: makerspaceID } });

  const [equipmentSearch, setEquipmentSearch] = useState("");

  const staffMode = isStaffFor(user, Number(makerspaceID))
  const [showHidden, setShowHidden] = useState(false);

  const setUrlParam = (paramName: string, paramValue: string) => {
    const params = new URLSearchParams(search);
    params.set(paramName, paramValue);
    navigate(`/makerspace/${makerspaceID}?` + params, { replace: true });
  };
  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const queryString = searchParams.get("a") ?? "";

    setEquipmentSearch(queryString)
  }, [search]);

  return (
    <RequestWrapper2 result={getMakerspace} render={(data) => {

      const fullSpace: FullMakerspace = data.makerspaceByID;
      const liveRooms = fullSpace.rooms.filter((room: Room) => !room.archived);

      const makerspaceTrainings = fullSpace.trainingModules.map(moduleStatusMapper(user.passedModules, user.trainingHolds));

      return (
        <Stack spacing={"2"} padding={isMobile ? "0 10px 10px" : "0 20px 20px"} divider={<Divider orientation="horizontal" flexItem />}>
          <title>{`${fullSpace.name} | ${makeTheme.title}`}</title>
          <StaffBar />
          {ExpandableHeader({ makerspace: fullSpace, makerspaceTrainings })}
          <Stack
            padding={"10px"}
            direction={isMobile ? "column" : "row"}
            justifyContent={isMobile ? undefined : "flex-start"}
            spacing={2}
            alignItems={"center"}
          >
            <SearchBar
              placeholder="Search Equipment"
              value={equipmentSearch}
              onChange={(e) => setEquipmentSearch(e.target.value)}
              onSubmit={() => setUrlParam("a", equipmentSearch)}
              onClear={() => setUrlParam("a", "")}
            />
            {
              isManagerFor(user, Number(makerspaceID)) && (
                <Stack direction={isMobile ? "column" : "row"} spacing={2}>
                  <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => (navigate(`/makerspace/${makerspaceID}/equipment/new`))}>
                    Create New Equipment
                  </Button>
                  <FormControlLabel
                    control={<Switch checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />}
                    label={"Show Hidden Equipment"}
                    labelPlacement="start" />
                </Stack>
              )
            }
          </Stack>

          {liveRooms.map((room: Room) => (
            <RoomSection
              room={room}
              equipmentSearch={equipmentSearch}
              isMobile={isMobile}
              staffMode={staffMode}
              showHidden={showHidden}
              makerspaceTrainings={{
                id: fullSpace.id,
                name: fullSpace.name,
                trainingModules: fullSpace.trainingModules,
              }}
            />
          ))}
        </Stack>
      );
    }} />
  );
}