import { Button, Card, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { TrainingModule } from "../../common/TrainingModuleUtils";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import GET_TRAINING_MODULES from "../../queries/trainingQueries";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { useState } from "react";
import { GET_ROOM } from "../../queries/roomQueries";
import { useParams } from "react-router-dom";

interface ManageRoomTrainingsProps {
    roomID: number;
    trainings: TrainingModule[];
}

const ADD_TRAINING_TO_ROOM = gql`
  mutation AddTrainingToRoom($roomID: ID!, $moduleID: ID!) {
    addTrainingToRoom(roomID: $roomID, moduleID: $moduleID) {
      id
    }
  }
`;

const REMOVE_TRAINING_FROM_ROOM = gql`
  mutation RemoveTrainingFromRoom($roomID: ID!, $moduleID: ID!) {
    removeTrainingFromRoom(roomID: $roomID, moduleID: $moduleID) {
      id
    }
  }
`;
export default function ManageRoomTrainings(props: ManageRoomTrainingsProps) {
    const { makerspaceID } = useParams<{ makerspaceID: string }>();

    const getModuleResults = useQuery(GET_TRAINING_MODULES);

    const [addTraining] = useMutation(ADD_TRAINING_TO_ROOM, { refetchQueries: [{ query: GET_ROOM, variables: { id: props.roomID } }] });
    const [removeTraining] = useMutation(REMOVE_TRAINING_FROM_ROOM, { refetchQueries: [{ query: GET_ROOM, variables: { id: props.roomID } }] });

    const [newTraining, setNewTraining] = useState(0);

    async function handleNewTraining() {
        if (newTraining === 0) {
            window.alert("Select a training");
            return;
        }

        await addTraining({ variables: { roomID: props.roomID, moduleID: newTraining } });
        window.location.reload();
    }

    return (
        <Stack spacing={2} width={"100%"}>
            <Typography variant="h5">Assigned Trainings</Typography>
            {
                props.trainings.map((training: TrainingModule) => (
                    <Card>
                        <Stack direction={"row"} justifyContent={"space-between"} padding={"10px"} alignItems={"center"}>
                            <Typography><b>{training.name}</b> ID: {training.id}</Typography>
                            <IconButton
                                color="error"
                                onClick={async () => {
                                    await removeTraining({ variables: { roomID: props.roomID, moduleID: training.id } });
                                    window.location.reload();
                                }}
                            >
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
                    (// Has permission to use this training
                    (possible.makerspaceID == null || Number(possible.makerspaceID) === Number(makerspaceID)) && !props.trainings.some((existing) => existing.id === possible.id)) // This training is not already assigned to the makerspace
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
