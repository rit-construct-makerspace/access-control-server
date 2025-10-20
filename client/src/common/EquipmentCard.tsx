import { Box, Button, Card, CardContent, CardMedia, Link, Stack, Typography, useTheme } from "@mui/material";
import Equipment from "../types/Equipment";
import { useCurrentUser } from "./CurrentUserProvider";
import { ModuleStatus, moduleStatusMapper } from "./TrainingModuleUtils";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate, useParams } from "react-router-dom";
import ConstructionIcon from "@mui/icons-material/Construction";
import ModuleStatusRow from "./ModuleStatusRow";
import ThemedMarkdown from "./ThemedMarkdown";
import { memo } from "react";
import { makeCDNLink } from "./ImageFinder.js";

interface EquipmentCardProps {
  equipment: Equipment;
  isMobile: boolean;
  staffMode: boolean;
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
  const equipmentIdsToHideCompetencyFor = (import.meta.env.VITE_EQUIPMENT_IDS_WITHOUT_INPERSON ?? "")
    .split(",")
    .map((s) => Number(s));
  const shouldHideCompetency = equipmentIdsToHideCompetencyFor.includes(Number(props.equipment.id));
  return (
    <Card
      sx={{
        width: props.isMobile ? "350px" : "600px",
        backgroundColor: props.equipment.archived ? theme.palette.error.light : undefined,
        height: "100%",
      }}
    >
      <CardContent sx={{ width: "100%", height: "100%" }}>
        <Stack height={"100%"}>
          <Stack direction="row" height="200px">
            {props.isMobile ? null :
              <Stack alignItems="center">
                <Box width="150px" height="200px">
                  <CardMedia
                    component="img"
                    image={makeCDNLink(props.equipment.imageUrl, "user-uploads/")}
                    alt={`Picture of ${props.equipment.name}`}
                    sx={{ width: "150px", height: "200px", backgroundColor: "lightgray" }}
                  />
                </Box>
              </Stack>
            }

            <Stack height="100%" width={"100%"}>
              {/* Title & Edit button */}
              <Stack direction="row" justifyContent="space-between" pl={"10px"}>
                <Typography variant="h6">{props.equipment.archived ? `${props.equipment.name} (Hidden)` : props.equipment.name}</Typography>
                {
                  isPriviledged
                    ? <Button
                      onClick={() => { navigate(`/makerspace/${makerspaceID}/equipment/${props.equipment.id}`) }}
                    aria-label="edit button"
                    sx={{ width: "40px", height: "40px" }}
                    variant="contained"
                    color="primary"
                  >
                    <ConstructionIcon />
                  </Button>
                    : null
                }
              </Stack>
              <Stack direction="row" justifyContent="space-between" height="100%">
                {/* Trainings & Access Check */}
                <Stack width="100%">
                  {hasNotTakenModule || (!hasApprovedAccessCheck && !props.equipment.byReservationOnly ) ? (
                    <Typography paddingLeft={"10px"}>To access, complete:</Typography>
                  ) : null}
                  {moduleStatuses.map((ms: ModuleStatus) => (
                    <ModuleStatusRow ms={ms} />
                  ))}
                  {!props.equipment.byReservationOnly && !shouldHideCompetency ? (
                    <Stack direction={"row"} spacing={1} alignItems="center" padding="10px">
                      {hasApprovedAccessCheck ? <CheckCircleIcon color="success" /> : <CloseIcon color="error" />}
                      <Typography variant="body2">In-Person Competency Check</Typography>
                    </Stack>
                  ) : null}
                </Stack>
                {/* Num available */}
                <Stack width="120px" height="100%" justifyContent={"center"} alignItems={"center"}>
                  {props.equipment.numAvailable + props.equipment.numInUse > 0 ? (
                    <Stack height="100%" justifyContent="center" alignItems="center">
                      <Typography variant="subtitle1" align="center" fontWeight="bold">
                        Machines Available
                      </Typography>
                      <Typography variant="subtitle1" align="center">
                        {`${props.equipment.numAvailable} / ${props.equipment.numAvailable + props.equipment.numInUse}`}
                      </Typography>
                    </Stack>
                  ) : (
                    <></>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </Stack>
          {/* Desc && reservation only? && learn more */}
          <Stack justifyContent={"space-between"} height={"inherit"}>
            <Typography>
              <ThemedMarkdown>{props.equipment.notes}</ThemedMarkdown>
            </Typography>
            {props.equipment.byReservationOnly ? (
              <Typography variant="subtitle1" ml={1}>
                Reservation only. Email{" "}
                <Link href={"mailto:make@rit.edu"} target={"_blank"}>
                  {" "}
                  make@rit.edu{" "}
                </Link>{" "}
                to schedule.
              </Typography>
            ) : null}
            <Button
              size="small"
              variant="contained"
              color="info"
              onClick={() => window.open(props.equipment.sopUrl, "_blank")}
              sx={{ alignSelf: "flex-end" }}
            >
              Learn More
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
});
export default EquipmentCard;
