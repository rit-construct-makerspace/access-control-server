import { useMutation } from "@apollo/client/react";
import { useNavigate, useParams } from "react-router-dom";
import { GET_TRAINING_MODULES, GET_ARCHIVED_TRAINING_MODULES, CREATE_TRAINING_MODULE, GET_MODULE } from "../../../queries/trainingQueries";
import 'react-toastify/dist/ReactToastify.css';
import {
  Button,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useState } from "react";
import { useMakeTheme } from "../../../common/MakeThemeProvider";


export default function NewModulePage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const makeTheme = useMakeTheme();

  const [title, setTitle] = useState("New Module");

  const [createModule] = useMutation(CREATE_TRAINING_MODULE);

  const executeCreate = async () => {
    await createModule({
      variables: {
        name: title,
        quiz: [],
        makerspaceID: makerspaceID,
      },
      refetchQueries: [
        { query: GET_ARCHIVED_TRAINING_MODULES },
        { query: GET_TRAINING_MODULES },
        { query: GET_MODULE },
      ],
      onCompleted: (data) => { const id = data.createModule.id; navigate(`/makerspace/${makerspaceID}/training/${id}`) },
      onError: () => { alert("Failed to create new module. Try again?"); navigate(`/makerspace/${makerspaceID}/trainings`); }
    });
  }

  function handleNameChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value)
  }


  return (
    <Stack padding="0 20px 20px" spacing={2}>
      <title>{`New Training | ${makeTheme.title}`}</title>
      <Typography variant="h4" textAlign={"center"}>New Training Module</Typography>

      <Stack justifyContent={"center"} direction={"row"} spacing={2}
        sx={{
          position: "sticky",
          top: "1px",
          backgroundColor: theme.palette.background.default,
          zIndex: 3000,
        }}
      >
        <TextField
          label="Module title"
          value={title}
          onChange={handleNameChanged}
          sx={{ width: "600px" }}
        />
        <Button startIcon={<SaveIcon />} color="secondary" variant="contained" onClick={executeCreate} size="large">Create</Button>
      </Stack>
    </Stack>
  );
}
