import { Button, Card, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { TrainingModule } from "../../common/TrainingModuleUtils";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQuery } from "@apollo/client";
import GET_TRAINING_MODULES from "../../queries/trainingQueries";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import { isManagerFor } from "../../common/PrivilegeUtils";
import { ADD_TRAINING_TO_ZONE, GET_ZONE_BY_ID, REMOVE_TRAINING_FROM_ZONE } from "../../queries/zoneQueries";
import { useState } from "react";

interface ManageMakerspaceTrainingsProps {
  makerspaceID: number;
  trainings: TrainingModule[];
}

export default function ManageMakerspaceTrainings(props: ManageMakerspaceTrainingsProps) {
  const currentUser = useCurrentUser();

  const getModuleResults = useQuery(GET_TRAINING_MODULES);

  const [addTraining] = useMutation(ADD_TRAINING_TO_ZONE, { refetchQueries: [{ query: GET_ZONE_BY_ID, variables: { id: props.makerspaceID } }] });
  const [removeTraining] = useMutation(REMOVE_TRAINING_FROM_ZONE, { refetchQueries: [{ query: GET_ZONE_BY_ID, variables: { id: props.makerspaceID } }] });

  const [newTraining, setNewTraining] = useState(0);

  function handleNewTraining() {
    if (newTraining == 0) {
      window.alert("Select a training")
    }

    addTraining({ variables: { zoneID: props.makerspaceID, moduleID: newTraining } });
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Assigned Trainings</Typography>
      {
        props.trainings.map((training: TrainingModule) => (
          <Card>
            <Stack direction={"row"} justifyContent={"space-between"} padding={"10px"} alignItems={"center"}>
              <Typography><b>{training.name}</b> ID: {training.id}</Typography>
              <IconButton color="error" onClick={() => removeTraining({ variables: { zoneID: props.makerspaceID, moduleID: training.id } })}>
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Card>
        ))
      }
      <RequestWrapper2 result={getModuleResults} render={(data) => {

        const rawModules: [TrainingModule] = data.modules;
        const possibleModuels = rawModules.filter((possible) =>
        (
          (possible.makerspaceID == null || isManagerFor(currentUser, possible.makerspaceID)) && // Has permission to use this training
          !props.trainings.some((existing) => existing.id == possible.id) // This training is not already assigned to the makerspace
        ))

        const sortedModules = possibleModuels.sort((a, b) => (a.name.toLowerCase().localeCompare(b.name.toLowerCase())));

        return (
          <Stack direction={"row"} spacing={1}>
            <FormControl fullWidth>
              <InputLabel id="add-training">Add Training</InputLabel>
              <Select id="add-training" label="Add Training" onChange={(e) => setNewTraining(Number(e.target.value))} fullWidth>
                {
                  sortedModules.map((option) => (
                    <MenuItem value={option.id}>{option.name} ID: {option.id}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            <Button startIcon={<AddIcon />} color="success" onClick={handleNewTraining}>Assign</Button>
          </Stack>
        );
      }} />
    </Stack>
  );
}