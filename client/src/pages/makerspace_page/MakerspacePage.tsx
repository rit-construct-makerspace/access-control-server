import { useQuery } from "@apollo/client";
import { Accordion, AccordionDetails, AccordionSummary, Alert, AlertTitle, Button, Card, CardContent, CardHeader, Divider, FormControlLabel, IconButton, Link, Stack, Switch, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { FullMakerspace, GET_MAKERSPACE_BY_ID } from "../../queries/makerspaceQueries";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { useState } from "react";
import RoomSection from "./RoomSection";
import Room from "../../types/Room";
import SearchBar from "../../common/SearchBar";
import StaffBar from "./StaffBar";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useIsMobile } from "../../common/IsMobileProvider";
import { isManagerFor, isStaffFor } from "../../common/PrivilegeUtils";
import { ModuleStatus, moduleStatusMapper } from "../../common/TrainingModuleUtils";
import MakerspaceHoursSection from "./MakerspaceHours";
import ModuleStatusRow from "../../common/ModuleStatusRow";
import { TrainingModule } from "../../types/TrainingModule";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Grid } from "@mui/system";

export default function MakerspacePage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const user = useCurrentUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const getMakerspace = useQuery(GET_MAKERSPACE_BY_ID, { variables: { id: makerspaceID } });

  const [equipmentSearch, setEquipmentSearch] = useState("");

  const staffMode = isStaffFor(user, Number(makerspaceID))
  const [showHidden, setShowHidden] = useState(false);

  function AboutCard(subtitle: string, location: string, docsLink: string){
    return <Card sx={{width: "600px", height: "100%"}}>
          <CardContent>
            <Typography variant="h6">About</Typography>
          <Typography variant="body1" color="textSecondary">Visit Us: {location}</Typography>
          <Typography variant="body2" color="textSecondary">{subtitle}</Typography>
          Visit our <Link href={docsLink}>Docs Page</Link> to learn more

          </CardContent>
    </Card>
  }

  function MakerspaceTrainingCard(makerspaceTrainings: ModuleStatus[]) {
    return <Card sx={{width: "600px", height: "100%"}}>
      <CardContent>
      <Typography variant="h6">Makerspace Trainings</Typography>
      {/* <Typography variant="body1" color="textSecondary">You must complete these trainings before using any equipment in the makerspace</Typography> */}
    
        <Stack direction={"column"} spacing={2} alignItems={"center"}>
          {
            makerspaceTrainings.some((ms) => (ms.status !== "Passed" && ms.status !== "Expiring Soon"))
              ? <Alert severity="error">You must pass the makerspace trainings before you can use equipment in the makerspace!</Alert>
              : null
          }
        </Stack>
        <Stack direction={"column"} spacing={1} alignItems={"center"}>
          {
            makerspaceTrainings.map((ms: ModuleStatus) => (
              <ModuleStatusRow ms={ms} />
            ))
          }
        </Stack>
      </CardContent>
    </Card>

  }


  function SpaceAccordion(name: string, subtitle: string, location: string, docsLink: string, makerspaceTrainings: ModuleStatus[]) {
    const hasIncompleteSpaceTrainings = makerspaceTrainings.some(ms => ms.status !== "Passed");
    return <Accordion defaultExpanded={hasIncompleteSpaceTrainings}>
      <AccordionSummary expandIcon={<KeyboardArrowDownIcon />}>
        <Stack direction={"row"} alignItems={"center"}>
          <Typography variant="h3">{name}</Typography>
          {
            isManagerFor(user, Number(makerspaceID))
              ? <IconButton
                onClick={() => { navigate(`/makerspace/${makerspaceID}/edit`) }}
                sx={{ color: "gray" }}
              ><EditIcon /></IconButton>
              : null
          }
          {hasIncompleteSpaceTrainings &&
            <Alert color="error">
              You have incomplete makerspace trainings. You will not be able to access any equipment
            </Alert>
          }
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        {
          makerspaceTrainings.length > 0 &&
          <Grid container spacing={3} justifyContent="center">
            {AboutCard(subtitle, location, docsLink)}
            {MakerspaceTrainingCard(makerspaceTrainings)}
          </Grid>
        }
      </AccordionDetails>
    </Accordion>

  }

  return (
    <RequestWrapper2 result={getMakerspace} render={(data) => {

      const fullSpace: FullMakerspace = data.makerspaceByID;

      const makerspaceTrainings = fullSpace.trainingModules.map(moduleStatusMapper(user.passedModules, user.trainingHolds));

      return (
        <Stack spacing={"2"} padding={"0 20px 20px"} divider={<Divider orientation="horizontal" flexItem />}>
          <title>{`${fullSpace.name} | Make @ RIT`}</title>
          <StaffBar />
          {!staffMode && <MakerspaceHoursSection hours={fullSpace.hours} isMobile={isMobile} />}
          {SpaceAccordion(fullSpace.name, fullSpace.subtitle ?? "", fullSpace.location ?? "", "http://http.cat/404", makerspaceTrainings)}
          <Stack padding={"10px"} direction="row" spacing={2}>
            <SearchBar
              placeholder="Search Equipment"
              value={equipmentSearch}
              onChange={(e) => setEquipmentSearch(e.target.value)}
              onClear={() => setEquipmentSearch("")}
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

          {fullSpace.rooms.map((room: Room) => (
            <RoomSection room={room} equipmentSearch={equipmentSearch} isMobile={isMobile} staffMode={staffMode} showHidden={showHidden} />
          ))}
        </Stack>
      );
    }} />
  );
}