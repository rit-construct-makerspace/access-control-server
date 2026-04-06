import { Box, Button, Card, CardContent, CardMedia, IconButton, Link, Stack, Typography, useTheme } from "@mui/material";
import Equipment from "../types/Equipment";
import { useCurrentUser } from "./CurrentUserProvider";
import { moduleStatusMapper, TrainingModule } from "./TrainingModuleUtils";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useNavigate, useParams } from "react-router-dom";
import ConstructionIcon from "@mui/icons-material/Construction";
import ThemedMarkdown from "./ThemedMarkdown";
import { memo } from "react";
import { makeCDNLink } from "./ImageFinder.js";
import EquipmentTrainingModal from "./EquipmentTrainingModal";

interface EquipmentCardProps {
  equipment: Equipment;
  isMobile: boolean;
  staffMode: boolean;
  makerspaceTrainings: {
    id: number;
    name: string;
    trainingModules: TrainingModule[];
  },
  roomTrainings: {
    id: number;
    name: string;
    trainingModules: TrainingModule[];
  }
  preview?: boolean;
}

const EquipmentCard = memo(function EquipmentCard(props: EquipmentCardProps) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const theme = useTheme();
  const isPriviledged = props.staffMode;
  const hasApprovedAccessCheck: boolean = user.accessChecks.some((ac) => Number(ac.equipmentID) === Number(props.equipment.id) && ac.approved)

  const moduleStatuses = props.equipment.trainingModules.map(
    moduleStatusMapper(user.passedModules, user.trainingHolds)
  );
  /**
   * This const is for checking if any of the trainings for an equipment card have not been taken by a user.
   *
   * @return {boolean} True if a module has not been taken; False if all modules have been taken.
   */
  const hasNotTakenModule = moduleStatuses.some((ms: { status: string }) => ms.status === "Not taken");

  return (
    <Card
      sx={{
        width: props.isMobile ? "350px" : "600px",
        height: "100%",
        boxSizing: "border-box",
        border: props.equipment.archived ? `5px solid ${theme.palette.error.main}` : undefined
      }}
    >
      <CardContent sx={{ width: "100%", height: "100%" }}>
        <Stack height={"100%"}>
          <Stack direction="row" height={props.isMobile ? undefined : "200px"}>
            {props.isMobile ? null :
              <Stack alignItems="center">
                <Box width="200px" height="200px">
                  <CardMedia
                    component="img"
                    image={makeCDNLink(props.equipment.imageUrl, "user-uploads/")}
                    alt={`Picture of ${props.equipment.name}`}
                    sx={{ width: "200px", height: "200px", backgroundColor: "lightgray" }}
                  />
                </Box>
              </Stack>
            }

            <Stack height="100%" width={"100%"}>
              {/* Title & Edit button */}
              <Stack direction="row" justifyContent="space-between" pl={"10px"}>
                <Stack>
                  <Typography variant="h6">{props.equipment.archived ? `${props.equipment.name} (Hidden)` : props.equipment.name}</Typography>
                  <Typography variant="subtitle1" fontStyle={"italic"} fontWeight={"regular"}>{props.equipment.subName}</Typography>
                </Stack>
                {
                  isPriviledged
                    ? <IconButton
                      onClick={() => { navigate(`/makerspace/${makerspaceID}/equipment/${props.equipment.id}`) }}
                      color="primary"
                      sx={{
                        width: "40px",
                        height: "40px"
                      }}
                    >
                      <ConstructionIcon />
                    </IconButton>
                    : null
                }
              </Stack>
              <Stack
                direction={props.isMobile ? "column" : "row"}
                justifyContent={props.isMobile ? undefined : "space-between"}
                height="100%"
              >
                {/* Trainings & Access Check */}
                <Stack width="100%" height={props.isMobile ? undefined : "100%"}>
                  <EquipmentTrainingModal
                    makerspaceTrainings={props.makerspaceTrainings}
                    roomTrainings={props.roomTrainings}
                    equipmentTrainings={{
                      id: props.equipment.id,
                      name: props.equipment.name,
                      trainingModules: props.equipment.trainingModules,
                    }}
                    requiresInPerson={props.equipment.requiresInPerson}
                    signOffUrl={props.equipment.signOffUrl}
                    preview={props.preview}
                  />
                </Stack>
                {/* Num available */}
                {
                  props.equipment.numAvailable + props.equipment.numInUse > 0 ?
                    <Stack
                      width={props.isMobile ? "100%" : "120px"}
                      height={props.isMobile ? undefined : "100%"}
                      justifyContent={"center"}
                      alignItems={"center"}
                    >
                      <Stack height={props.isMobile ? undefined : "100%"} justifyContent="center" alignItems="center" direction={props.isMobile ? "row" : "column"} spacing={props.isMobile ? 1 : undefined}>
                        <Typography variant="subtitle1" align="center" fontWeight="bold">
                          Machines Available{props.isMobile ? ":" : ""}
                        </Typography>
                        <Typography variant="subtitle1" align="center">
                          {`${props.equipment.numAvailable} / ${props.equipment.numAvailable + props.equipment.numInUse}`}
                        </Typography>
                      </Stack>
                    </Stack>
                    : null
                }
              </Stack>
            </Stack>
          </Stack>
          {/* Desc && reservation only? && learn more */}
          <Stack justifyContent={"space-between"} height={"inherit"}>
            <ThemedMarkdown>{props.equipment.notes}</ThemedMarkdown>
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
              {
                props.equipment.byReservationOnly ? (
                  <Typography variant="subtitle1" textAlign={props.isMobile ? "center" : undefined}>
                    Reservation only. Email{" "}
                    <Link href={"mailto:make@rit.edu"} target={"_blank"}>
                      {" "}
                      make@rit.edu{" "}
                    </Link>{" "}
                    to schedule.
                  </Typography>
                ) : <Typography />
              }
              <Stack direction={props.isMobile ? "column" : "row"} spacing={1} alignItems={"center"}>
                {
                  props.equipment.schedulable
                    ? <Button
                      color="secondary"
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/makerspace/${makerspaceID}/reserve/${props.equipment.id}`)}
                      disabled={hasNotTakenModule || (props.equipment.requiresInPerson && !hasApprovedAccessCheck)}
                      fullWidth={props.isMobile}
                    >
                      Reserve
                    </Button>
                    : props.equipment.byReservationOnly
                      ? <Button
                        color="secondary"
                        variant="contained"
                        size="small"
                        onClick={() => navigate(`/makerspace/${makerspaceID}/reserve/${props.equipment.id}`)}
                        fullWidth={props.isMobile}
                      >
                        <CalendarMonthIcon />
                      </Button>
                      : null
                }
                {
                  props.equipment.sopUrl !== ""
                    ? <Button
                      size="small"
                      variant="contained"
                      color="info"
                      onClick={() => window.open(props.equipment.sopUrl, "_blank")}
                      sx={{ alignSelf: "flex-end", height: "100%" }}
                    >
                      Learn More
                    </Button>
                    : null
                }

              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card >
  );
});
export default EquipmentCard;
