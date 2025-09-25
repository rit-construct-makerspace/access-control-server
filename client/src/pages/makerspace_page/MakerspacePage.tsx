import { useQuery } from "@apollo/client";
import { Alert, Button, Divider, FormControlLabel, IconButton, Stack, Switch, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { FullMakerspace, GET_MAKERSPACE_BY_ID } from "../../queries/makerspaceQueries";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { useState } from "react";
import RoomSection from "./RoomSection";
import Room from "../../types/Room";
import SearchBar from "../../common/SearchBar";
import StaffBar from "./StaffBar";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useIsMobile } from "../../common/IsMobileProvider";
import { isManagerFor, isStaffFor } from "../../common/PrivilegeUtils";
import { ModuleStatus, moduleStatusMapper } from "../../common/TrainingModuleUtils";
import MakerspaceHoursSection from "./MakerspaceHours";
import ModuleStatusRow from "../../common/ModuleStatusRow";

export default function MakerspacePage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const user = useCurrentUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const getMakerspace = useQuery(GET_MAKERSPACE_BY_ID, { variables: { id: makerspaceID } });

  const [equipmentSearch, setEquipmentSearch] = useState("");

  const staffMode = isStaffFor(user, Number(makerspaceID));
  const [showHidden, setShowHidden] = useState(false);

  return (
    <RequestWrapper2
      result={getMakerspace}
      render={(data) => {
        const fullSpace: FullMakerspace = data.makerspaceByID;

        const unarchivedRooms = fullSpace.rooms.filter((room) => !room.archived);

        const makerspaceTrainings = fullSpace.trainingModules.map(
          moduleStatusMapper(user.passedModules, user.trainingHolds)
        );

        return (
          <Stack spacing={"2"} padding={"0 20px 20px"} divider={<Divider orientation="horizontal" flexItem />}>
            <StaffBar />
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} width="auto">
              <title>{`${fullSpace.name} | Make @ RIT`}</title>
              <Typography variant="h3" align="center">
                {fullSpace.name}
              </Typography>
              {isManagerFor(user, Number(makerspaceID)) ? (
                <IconButton
                  onClick={() => {
                    navigate(`/makerspace/${makerspaceID}/edit`);
                  }}
                  sx={{ color: "gray" }}
                >
                  <EditIcon />
                </IconButton>
              ) : null}
            </Stack>
            <MakerspaceHoursSection hours={fullSpace.hours} isMobile={isMobile} />
            {makerspaceTrainings.length > 0 && (
              <Stack direction={"column"} alignItems={"center"} padding={"10px 0"} spacing={1}>
                <Stack direction={isMobile ? "column" : "row"} spacing={2} alignItems={"center"}>
                  <Typography variant="h6">Makerspace Trainings</Typography>
                  {makerspaceTrainings.some((ms) => ms.status !== "Passed" && ms.status !== "Expiring Soon") ? (
                    <Alert severity="error">
                      You must pass the makerspace trainings before you can use equipment in the makerspace!
                    </Alert>
                  ) : null}
                </Stack>
                <Stack direction={isMobile ? "column" : "row"} spacing={1} alignItems={"center"}>
                  {makerspaceTrainings.map((ms: ModuleStatus) => (
                    <ModuleStatusRow ms={ms} />
                  ))}
                </Stack>
              </Stack>
            )}
            <Stack padding={"10px"} direction="row" spacing={2}>
              <SearchBar
                placeholder="Search Equipment"
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                onClear={() => setEquipmentSearch("")}
              />
              {isManagerFor(user, Number(makerspaceID)) && (
                <Stack direction={isMobile ? "column" : "row"} spacing={2}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/makerspace/${makerspaceID}/equipment/new`)}
                  >
                    Create New Equipment
                  </Button>
                  <FormControlLabel
                    control={<Switch checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />}
                    label={"Show Hidden Equipment"}
                    labelPlacement="start"
                  />
                </Stack>
              )}
            </Stack>
            {unarchivedRooms.map((room: Room) => (
              <RoomSection
                room={room}
                equipmentSearch={equipmentSearch}
                isMobile={isMobile}
                staffMode={staffMode}
                showHidden={showHidden}
              />
            ))}
          </Stack>
        );
      }}
    />
  );
}
