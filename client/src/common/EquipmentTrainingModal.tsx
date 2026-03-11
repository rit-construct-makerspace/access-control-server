import { useQuery } from "@apollo/client";
import { GET_EQUIPMENT_TRAININGS_BY_ID } from "../queries/equipmentQueries";
import PrettyModal from "./PrettyModal";
import { Button, CircularProgress, Divider, IconButton, LinearProgress, Stack, Typography } from "@mui/material";
import { ModuleStatus, moduleStatusMapper, TrainingModule } from "./TrainingModuleUtils";
import { useCurrentUser } from "./CurrentUserProvider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ModuleStatusRow from "./ModuleStatusRow";
import { useState } from "react";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";

interface EquipmentTrainingModalProps {
  makerspaceTrainings: {
    id: number;
    name: string;
    trainingModules: TrainingModule[];
  };
  roomTrainings: {
    id: number;
    name: string;
    trainingModules: TrainingModule[];
  };
  equipmentTrainings: {
    id: number;
    name: string;
    trainingModules: TrainingModule[];
  };
  requiresInPerson: boolean;
}

export default function EquipmentTrainingModal(props: EquipmentTrainingModalProps) {
  const user = useCurrentUser();

  if (props.equipmentTrainings.trainingModules.length === 0) {
    return;
  }

  const hasApprovedAccessCheck: boolean = user.accessChecks.some((ac) => Number(ac.equipmentID) === Number(props.equipmentTrainings.id) && ac.approved)

  const makerspaceStatuses: ModuleStatus[] = props.makerspaceTrainings.trainingModules.map(moduleStatusMapper(user.passedModules, user.trainingHolds));
  const roomStatuses: ModuleStatus[] = props.roomTrainings.trainingModules.map(moduleStatusMapper(user.passedModules, user.trainingHolds));
  const equipmentStatuses: ModuleStatus[] = props.equipmentTrainings.trainingModules.map(moduleStatusMapper(user.passedModules, user.trainingHolds));

  const makerspaceReqsComplete: number = makerspaceStatuses.filter((module) => module.status === "Passed" || module.status === "Expiring Soon").length;
  const roomReqsComplete: number = roomStatuses.filter((module) => module.status === "Passed" || module.status === "Expiring Soon").length;
  const equipmentReqsComplete: number = equipmentStatuses.filter((module) => module.status === "Passed" || module.status === "Expiring Soon").length + ((props.requiresInPerson && hasApprovedAccessCheck) ? 1 : 0);

  const byExpiry = [...makerspaceStatuses, ...roomStatuses, ...equipmentStatuses]
    .filter((module) => module.status === "Expiring Soon" || module.status === "Passed")
    .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

  const totalRequirements = makerspaceStatuses.length + roomStatuses.length + equipmentStatuses.length + (props.requiresInPerson ? 1 : 0);
  const totalReqsComplete = makerspaceReqsComplete + roomReqsComplete + equipmentReqsComplete;

  const percentComplete: number = Math.ceil(totalReqsComplete / totalRequirements * 100);

  const [open, setOpen] = useState(false);

  return (
    <Stack width={"100%"} height={"100%"} justifyContent={"center"} alignItems={"center"}>
      <Stack width={"max-content"} alignItems={"center"} spacing={2}>
        <Button
          onClick={() => setOpen(true)}
          startIcon={
            totalReqsComplete !== totalRequirements
              ? <CloseIcon />
              : byExpiry.length > 0 && byExpiry[0].status === "Expiring Soon"
                ? <HourglassBottomIcon />
                : <CheckCircleIcon />
          }
          endIcon={
            <ArrowForwardIosIcon />
          }
          variant="contained"
          color={
            totalReqsComplete !== totalRequirements
              ? "primary"
              : byExpiry.length > 0 && byExpiry[0].status === "Expiring Soon"
                ? "warning"
                : "success"
          }
          size="large"
          sx={{
            width: "max-content"
          }}
        >
          Training Checklist
        </Button>
        <LinearProgress
          variant="determinate"
          value={percentComplete}
          color={
            totalReqsComplete !== totalRequirements
              ? "primary"
              : byExpiry.length > 0 && byExpiry[0].status === "Expiring Soon"
                ? "warning"
                : "success"
          }
          sx={{
            width: "95%",
            height: "8px"
          }}
        />
        <Typography variant="subtitle1" fontWeight={"bold"}>{percentComplete}% Complete</Typography>
      </Stack>
      <PrettyModal open={open} onClose={() => setOpen(false)} width={"1000px"}>
        <Stack spacing={2}>
          <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
            <Typography variant="h5">{props.equipmentTrainings.name} Training Checklist</Typography>
            <IconButton
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack direction={"row"} justifyContent={"space-between"}>
            <Stack sx={{ width: "69%" }} spacing={2}>
              {
                props.makerspaceTrainings.trainingModules.length > 0
                  ? <Stack>
                    <Typography variant="h6">Makerspace Requirements</Typography>
                    {
                      makerspaceStatuses.map((moduleStatus) => <ModuleStatusRow ms={moduleStatus} />)
                    }
                  </Stack>
                  : null
              }
              {
                props.roomTrainings.trainingModules.length > 0
                  ? <Stack>
                    <Typography variant="h6">Area Requirements</Typography>
                    {
                      roomStatuses.map((moduleStatus) => <ModuleStatusRow ms={moduleStatus} />)
                    }
                  </Stack>
                  : null
              }
              {
                (props.equipmentTrainings.trainingModules.length > 0 || props.requiresInPerson)
                  ? <Stack>
                    <Typography variant="h6">Equipment Requirements</Typography>
                    {
                      equipmentStatuses.map((moduleStatus) => <ModuleStatusRow ms={moduleStatus} />)
                    }
                    {
                      props.requiresInPerson
                        ? <Stack direction={"row"} spacing={1} alignItems="center" padding="7px">
                          {user.visitor ? (
                            <RadioButtonUncheckedIcon color="secondary" />
                          ) : hasApprovedAccessCheck ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <CloseIcon color="error" />
                          )}
                          <Typography variant="body2">Staff Sign-Off</Typography>
                        </Stack>
                        : null
                    }
                  </Stack>
                  : null
              }

            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack sx={{ width: "29%" }} alignItems={"center"} spacing={2} justifyContent={"center"}>
              <CircularProgress
                variant="determinate"
                value={percentComplete}
                color={
                  totalReqsComplete !== totalRequirements
                    ? "primary"
                    : byExpiry.length > 0 && byExpiry[0].status === "Expiring Soon"
                      ? "warning"
                      : "success"
                }
                size={"125px"}
              />
              <Stack alignItems={"center"} spacing={1}>
                <Typography variant="subtitle1">
                  {percentComplete}% Complete
                </Typography>
                {
                  ((percentComplete > 66) || (totalReqsComplete > 1 && totalRequirements - totalReqsComplete === 1)) && (totalReqsComplete !== totalRequirements)
                    ? <Typography variant="subtitle2">
                      Almost there!
                    </Typography>
                    : null
                }
                {
                  (totalRequirements === totalReqsComplete && byExpiry.length > 0)
                    ? <Typography variant="subtitle2">
                      All Set Until: {byExpiry[0].expirationDate}
                    </Typography>
                    : null
                }
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </PrettyModal>
    </Stack>
  );

}