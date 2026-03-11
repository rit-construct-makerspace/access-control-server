import { useQuery } from "@apollo/client";
import { GET_EQUIPMENT_TRAININGS_BY_ID } from "../queries/equipmentQueries";
import PrettyModal from "./PrettyModal";
import { Divider, LinearProgress, Stack, Typography } from "@mui/material";
import { moduleStatusMapper, TrainingModule } from "./TrainingModuleUtils";
import { useCurrentUser } from "./CurrentUserProvider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ModuleStatusRow from "./ModuleStatusRow";

interface EquipmentTrainingModalProps {
  open: boolean;
  onClose: () => void;
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

  const hasApprovedAccessCheck: boolean = user.accessChecks.some((ac) => Number(ac.equipmentID) === Number(props.equipmentTrainings.id) && ac.approved)

  return (
    <PrettyModal open={props.open} onClose={props.onClose} width={"1000px"}>
      <Stack direction={"row"} justifyContent={"space-between"}>
        <Stack sx={{ width: "69%" }} spacing={2}>
          {
            props.makerspaceTrainings.trainingModules.length > 0
              ? <Stack>
                <Typography variant="h5">{props.makerspaceTrainings.name} Requirements</Typography>
                {
                  props.makerspaceTrainings.trainingModules.map(moduleStatusMapper(user.passedModules, user.trainingHolds))
                    .map((moduleStatus) => <ModuleStatusRow ms={moduleStatus} />)
                }
              </Stack>
              : null
          }
          {
            props.roomTrainings.trainingModules.length > 0
              ? <Stack>
                <Typography variant="h5">{props.roomTrainings.name} Requirements</Typography>
                {
                  props.roomTrainings.trainingModules.map(moduleStatusMapper(user.passedModules, user.trainingHolds))
                    .map((moduleStatus) => <ModuleStatusRow ms={moduleStatus} />)
                }
              </Stack>
              : null
          }
          {
            (props.equipmentTrainings.trainingModules.length > 0 || props.requiresInPerson)
              ? <Stack>
                <Typography variant="h5">{props.equipmentTrainings.name} Requirements</Typography>
                {
                  props.equipmentTrainings.trainingModules.map(moduleStatusMapper(user.passedModules, user.trainingHolds))
                    .map((moduleStatus) => <ModuleStatusRow ms={moduleStatus} />)
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
        <Stack sx={{ width: "29%" }}>
          {
            <Typography textAlign={"center"}>you can use this :)</Typography>
          }
        </Stack>
      </Stack>
    </PrettyModal>
  );

}