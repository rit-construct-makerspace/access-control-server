import { useMutation } from "@apollo/client";
import { useNavigate, useParams } from "react-router-dom";
import { Moduledraft, QuizItem } from "../../../types/Quiz";
import { GET_TRAINING_MODULES, GET_ARCHIVED_TRAINING_MODULES, CREATE_TRAINING_MODULE } from "../../../queries/trainingQueries";
import 'react-toastify/dist/ReactToastify.css';
import {
  Button,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useImmer } from "use-immer";
import QuizBuilder from "./quiz/QuizBuilder";
import { toast } from 'react-toastify';
import SaveIcon from "@mui/icons-material/Save";
import { ChangeEventHandler } from "react";
import { DropResult } from "@hello-pangea/dnd";


export default function EditNewModulePage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [moduleDraft, setModuleDraft] = useImmer<Moduledraft>({
    name: "",
    archived: true,
    quiz: [],
  });

  const [updateModule, updateResult] = useMutation(CREATE_TRAINING_MODULE);

  const executeSave = async (updatedModule: Moduledraft) => {
    await updateModule({
      variables: {
        name: updatedModule.name,
        quiz: updatedModule.quiz,
        makerspaceID: makerspaceID,
      },
      refetchQueries: [
        { query: GET_ARCHIVED_TRAINING_MODULES },
        { query: GET_TRAINING_MODULES },
      ],
      onCompleted: () => navigate(`/makerspace/${makerspaceID}/trainings`),
    });
  }

  const trainingModSavedAnimation = () => {
    toast.success('Training Module Saved', {
      position: "bottom-left",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  }


  const handleSaveClicked = async () => {
    if (!moduleDraft.name) {
      window.alert("Please specify a name.");
      return;
    }

    if (moduleDraft.quiz.length === 0) {
      window.alert("Please add content to the training.");
      return;
    }

    await executeSave(moduleDraft);

    trainingModSavedAnimation();
  }


  const handleNameChanged: ChangeEventHandler<HTMLInputElement> = (e) => {
    setModuleDraft({ ...moduleDraft, name: e.target.value });
  };

  const handleAddQuizItem = (item: QuizItem) => {
    setModuleDraft((draft) => {
      draft?.quiz.push(item);
    });
  };

  const handleRemoveQuizItem = (itemId: string) => {
    setModuleDraft((draft) => {
      const index = draft!.quiz.findIndex((i) => i.id === itemId);
      draft?.quiz.splice(index, 1);
    });
  };

  const handleUpdateQuizItem = (itemId: string, updatedItem: QuizItem) => {
    setModuleDraft((draft) => {
      const index = draft!.quiz.findIndex((i) => i.id === itemId);
      draft!.quiz[index] = updatedItem;
    });
  };

  const handleOnDragEnd = (result: DropResult) => {
    setModuleDraft((draft) => {
      if (!result.destination) return;

      const [removed] = draft!.quiz.splice(result.source.index, 1);
      draft!.quiz.splice(result.destination.index, 0, removed);
    });
  };

  return (
    <Stack padding="0 20px 20px" spacing={2}>
      <title>New Training | Make @ RIT</title>
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
          value={moduleDraft.name}
          onChange={handleNameChanged}
          sx={{ width: "600px" }}
        />
        <Button startIcon={<SaveIcon />} color="secondary" variant="contained" onClick={handleSaveClicked} size="large">Save</Button>
      </Stack>
      <QuizBuilder quiz={moduleDraft.quiz ? moduleDraft.quiz : []} handleAdd={handleAddQuizItem} handleRemove={handleRemoveQuizItem} handleUpdate={handleUpdateQuizItem} handleOnDragEnd={handleOnDragEnd} />
    </Stack>
  );
}
