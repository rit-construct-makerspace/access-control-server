import { useQuery } from "@apollo/client";
import { GET_EQUIPMENT_TRAININGS_BY_ID } from "../queries/equipmentQueries";
import PrettyModal from "./PrettyModal";
import { Divider, LinearProgress, Stack, Typography } from "@mui/material";
import TrainingModuleRow from "./TrainingModuleRow";
import { moduleStatusMapper, TrainingModule } from "./TrainingModuleUtils";
import { useCurrentUser } from "./CurrentUserProvider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

interface EquipmentTrainingModalProps {
  equipmentID: number;
  open: boolean;
  onClose: () => void;
}

export default function EquipmentTrainingModal(props: EquipmentTrainingModalProps) {
  const user = useCurrentUser();

  const equipmentTrainingsResult = useQuery(GET_EQUIPMENT_TRAININGS_BY_ID, { variables: { id: props.equipmentID } });

  const equipmentTrainings: TrainingModule[] = equipmentTrainingsResult.data?.equipment.trainingModules ?? [];
  const roomTrainings: TrainingModule[] = equipmentTrainingsResult.data?.equipment.room.trainingModules ?? [];
  const makerspaceTrainings: TrainingModule[] = equipmentTrainingsResult.data?.equipment.room.makerspace.trainingModules ?? [];

  const hasApprovedAccessCheck: boolean = user.accessChecks.some((ac) => Number(ac.equipmentID) === Number(props.equipmentID) && ac.approved)

  return (
    <PrettyModal open={props.open} onClose={props.onClose}>
      <Stack direction={"row"} width={"600px"}>
        {
          equipmentTrainingsResult.loading
            ? <LinearProgress color="primary" />
            : null
        }
        <Stack sx={{ width: "70%" }}>
          {
            makerspaceTrainings.length > 0
              ? <Stack>
                <Typography variant="h3">{equipmentTrainingsResult.data?.equipment.room.makerspace.name ?? "Loading Makerspace"} Trainings</Typography>
                <Divider orientation="horizontal" />
                {
                  makerspaceTrainings.map(moduleStatusMapper(user.passedModules, user.trainingHolds))
                    .map((moduleStatus) => <TrainingModuleRow moduleStatus={moduleStatus} />)
                }
              </Stack>
              : null
          }
          {
            roomTrainings.length > 0
              ? <Stack>
                <Typography variant="h3">{equipmentTrainingsResult.data?.equipment.room.name ?? "Loading Room"} Trainings</Typography>
                <Divider orientation="horizontal" />
                {
                  roomTrainings.map(moduleStatusMapper(user.passedModules, user.trainingHolds))
                    .map((moduleStatus) => <TrainingModuleRow moduleStatus={moduleStatus} />)
                }
              </Stack>
              : null
          }
          {
            equipmentTrainings.length > 0
              ? <Stack>
                <Typography variant="h3">{equipmentTrainingsResult.data?.equipment.name ?? "Loading Equipment"} Trainings</Typography>
                <Divider orientation="horizontal" />
                {
                  equipmentTrainings.map(moduleStatusMapper(user.passedModules, user.trainingHolds))
                    .map((moduleStatus) => <TrainingModuleRow moduleStatus={moduleStatus} />)
                }
              </Stack>
              : null
          }
          {
            equipmentTrainingsResult.data?.equipment.requiresInPerson
              ? <Stack>
                <Typography variant="h3">{equipmentTrainingsResult.data?.equipment.name ?? "Loading Equipment"} Check</Typography>
                <Divider orientation="horizontal" />
                <Stack direction={"row"} spacing={1} alignItems="center" padding="7px">
                  {user.visitor ? (
                    <RadioButtonUncheckedIcon color="secondary" />
                  ) : hasApprovedAccessCheck ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CloseIcon color="error" />
                  )}
                  <Typography variant="body2">Staff Sign-Off</Typography>
                </Stack>{

                }
              </Stack>
              : null
          }
        </Stack>
        <Divider orientation="vertical" />
        <Stack sx={{ width: "30%" }}>

        </Stack>
      </Stack>
    </PrettyModal>
  );

}