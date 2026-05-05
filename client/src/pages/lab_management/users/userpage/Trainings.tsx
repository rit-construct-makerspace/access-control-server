import { Alert, Box, Button, Card, IconButton, Stack, Typography } from "@mui/material";
import { format } from "date-fns";
import { isStaffFor } from "../../../../common/PrivilegeUtils";
import { useCurrentUser } from "../../../../common/CurrentUserProvider";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { GET_USER } from "../../../../queries/userQueries";
import DeleteIcon from '@mui/icons-material/Delete';


const DELETE_PASSED_MODULE = gql`
  mutation DeletePassedModule($userID: ID!, $moduleID: ID!) {
    deletePassedModule(userID: $userID, moduleID: $moduleID)
  }
`;

const DELETE_TRAINING_HOLD = gql`
  mutation DeleteTrainingHold($id: ID!) {
    deleteTrainingHold(id: $id)
  }
`;

interface TrainingProps {
  user: any;
}

export default function Trainings(props: TrainingProps) {
  const currentUser = useCurrentUser();

  const [deletePassedModule] = useMutation(DELETE_PASSED_MODULE, { refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });
  const [deleteTrainingHold] = useMutation(DELETE_TRAINING_HOLD, { refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });

  function handleTrainingHoldDeleteClick(id: number) {
    deleteTrainingHold({ variables: { id } });
  }

  return (
    <Stack>
      <Typography variant="h6" component="div" mt={4} mb={1}>
        Passed Trainings
      </Typography>

      {
        (props.user.passedModules == null || (props.user.passedModules.length === 0)) && (
          <Alert severity="info">No Passed Trainings</Alert>
        )
      }

      <Box sx={{ maxHeight: "300px", overflowY: "scroll" }}>
        <Stack spacing={0.5}>
          {props.user.passedModules != null && props.user.passedModules.map((module: { moduleID: number, moduleName: string, passedDate: string, makerspaceID: string }) => (
            <Card sx={{ p: "0.25em", border: `1px solid grey` }}>
              <Stack direction={"row"} sx={{ justifyContent: "space-between" }} alignItems={"center"}>
                <Typography>{module.moduleName}</Typography>
                <Stack direction={"row"} spacing={1} alignItems={"center"}>
                  <Typography>{format(new Date(module.passedDate), "M/d/yy h:mmaaa")}</Typography>
                  <IconButton
                    color="error"
                    disabled={!isStaffFor(currentUser, module.moduleID ?? -1)}
                    onClick={() => deletePassedModule({ variables: { userID: props.user.id, moduleID: module.moduleID } })}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Box>


      <Typography variant="h6" component="div" mt={6} mb={1}>
        Locked Trainings
      </Typography>

      {
        (props.user.trainingHolds == null || (props.user.trainingHolds.length === 0)) && (
          <Alert severity="success" variant="filled">No Locked Trainings</Alert>
        )
      }

      <Box sx={{ maxHeight: "300px", overflowY: "scroll" }}>
        <Stack spacing={0.5}>
          {props.user.trainingHolds != null && props.user.trainingHolds.map((hold: { id: number; expires: Date; module: { id: number; name: string } }) => (
            <Card sx={{ p: "0.25em", border: `1px solid grey` }}>
              <Stack direction={"row"} alignItems={"center"} sx={{ justifyContent: "space-between" }}>
                <Stack direction={"row"} alignItems={"center"} spacing={2}>
                  <Typography color={"secondary"}><b>Exp: </b>{format(new Date(hold.expires), "M/d/yy h:mmaaa")}</Typography>
                  <Typography>{hold.module.name}</Typography>
                </Stack>
                <Button variant="text" color="success" onClick={() => handleTrainingHoldDeleteClick(hold.id)}>Unlock</Button>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Box>
    </Stack>
  )
}