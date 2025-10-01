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

        const makerspaceTrainings = fullSpace.trainingModules.map(
          moduleStatusMapper(user.passedModules, user.trainingHolds)
        );

        return (
          <Stack spacing={"2"} padding={"0 20px 20px"} divider={<Divider orientation="horizontal" flexItem />}>
            <title>{`${fullSpace.name} | Make @ RIT`}</title>
            <StaffBar />
            {ExpandableHeader({ makerspace: fullSpace, makerspaceTrainings })}
            <Stack
              padding={"10px"}
              direction="row"
              justifyContent={isMobile ? "space-between" : "flex-start"}
              spacing={2}
            >
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
            {fullSpace.rooms.map((room: Room) => (
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
