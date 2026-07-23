import PrettyModal from "./PrettyModal";
import { Button, CardActionArea, Divider, IconButton, LinearProgress, Link, Stack, Typography } from "@mui/material";
import { ModuleStatus, moduleStatusMapper, TrainingModule } from "./TrainingModuleUtils";
import { useCurrentUser } from "./CurrentUserProvider";
import CloseIcon from "@mui/icons-material/Close";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ModuleStatusRow from "./ModuleStatusRow";
import { useState } from "react";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import CircularProgressWithContent from "./CircularProgressWithContent";
import CheckIcon from '@mui/icons-material/Check';
import { useIsMobile } from "./IsMobileProvider";
import { toast } from "react-toastify";

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
  signOffUrl: string;
  preview?: boolean;
}

export default function EquipmentTrainingModal(props: EquipmentTrainingModalProps) {
  const user = useCurrentUser();
  const isMobile = useIsMobile();

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

  const percentComplete: number = Math.round(totalReqsComplete / totalRequirements * 100);

  const [open, setOpen] = useState(false);

  if (props.equipmentTrainings.trainingModules.length === 0 && !props.requiresInPerson) {
    return;
  }

  return (
    <Stack width={"100%"} height={"100%"} justifyContent={"center"} alignItems={"center"}>
      <Stack width={"max-content"} alignItems={"center"} justifyContent={"center"} spacing={2}>
        <Button
          onClick={props.preview ? () => toast.info("Preview Only!") : () => setOpen(true)}
          startIcon={
            totalReqsComplete !== totalRequirements
              ? <CloseIcon />
              : byExpiry.length > 0 && byExpiry[0].status === "Expiring Soon"
                ? <HourglassBottomIcon />
                : <CheckIcon />
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
          disabled={user.visitor}
        >
          Training Checklist
        </Button>
        {
          user.visitor
            ? <Typography variant="subtitle1" fontWeight={"bold"}>Sign In to View Training Progress</Typography>
            : <Stack alignItems={"center"} width={"100%"}>
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
                  height: "16px"
                }}
              />
              <Typography variant="subtitle1" fontWeight={"bold"}>
                {
                  totalReqsComplete !== totalRequirements
                    ? `${percentComplete}% Complete`
                    : byExpiry.length > 0 && byExpiry[0].status === "Expiring Soon"
                      ? "Expiring Soon!"
                      : "All Set!"
                }
              </Typography>
            </Stack>
        }
      </Stack>
      <PrettyModal open={open} onClose={() => setOpen(false)} width={isMobile ? "95%" : "1000px"}>
        <Stack spacing={2}>
          <Stack direction={"row"} justifyContent={"space-between"} alignItems={isMobile ? "start" : "center"}>
            <Typography variant="h5">{props.equipmentTrainings.name} Training Checklist</Typography>
            <IconButton
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack direction={isMobile ? "column" : "row"} justifyContent={"space-between"} spacing={isMobile ? 2 : undefined}>
            <Stack sx={{ width: isMobile ? "100%" : "69%" }} spacing={2}>
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
                        ? <CardActionArea
                          onClick={props.signOffUrl ? () => window.open(props.signOffUrl, "_blank noopener noreferrer") : undefined}
                          disableRipple={props.signOffUrl === ""}
                        >
                          <Stack direction={"row"} spacing={1} alignItems="center" padding="7px">
                            {user.visitor ? (
                              <RadioButtonUncheckedIcon color="secondary" />
                            ) : hasApprovedAccessCheck ? (
                              <CheckIcon color="success" />
                            ) : (
                              <CloseIcon color="error" />
                            )}
                            <Stack direction={"column"} width={"100%"}>
                              {
                                props.signOffUrl !== ""
                                  ? <Link variant="body2">Staff Sign-Off</Link>
                                  : <Typography variant="body2">Staff Sign-Off</Typography>
                              }
                              {
                                !user.accessChecks.some((check) => Number(check.equipmentID) === props.equipmentTrainings.id && check.approved)
                                  ? <Typography variant="body2">Complete all other requirments before attempting sign-off!</Typography>
                                  : null
                              }
                            </Stack>
                          </Stack>
                        </CardActionArea>
                        : null
                    }
                  </Stack>
                  : null
              }

            </Stack>
            <Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem />
            <Stack sx={{ width: isMobile ? "100%" : "29%" }} alignItems={"center"} spacing={2} justifyContent={"center"}>
              <CircularProgressWithContent
                enableTrackSlot
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
                icon={
                  totalReqsComplete !== totalRequirements
                    ? <CloseIcon sx={{ width: "70%", height: "70%" }} color="error" />
                    : byExpiry.length > 0 && byExpiry[0].status === "Expiring Soon"
                      ? <HourglassBottomIcon sx={{ width: "70%", height: "70%" }} color="warning" />
                      : <CheckIcon sx={{ width: "70%", height: "70%" }} color="success" />

                }
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