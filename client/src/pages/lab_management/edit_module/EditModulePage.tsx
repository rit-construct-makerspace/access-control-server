import QuizBuilder from "./quiz/QuizBuilder";
import {
  Box,
  Button,
  CircularProgress,
  Fab,
  Grid,
  IconButton,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Page from "../../Page";
import SaveIcon from "@mui/icons-material/Save";
import { useImmer } from "use-immer";
import { Module, QuizItem } from "../../../types/Quiz";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PublishTrainingModuleButton from "../training_modules/PublishTrainingModuleButton";
import ArchiveTrainingModuleButton from "../training_modules/ArchiveTrainingModuleButton";
import { DropResult } from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
interface EditModulePageProps {
  moduleInitialValue: Module;
  deleteModule: () => Promise<void>;
  updateModule: (updatedModule: Module) => Promise<void>;
  updateLoading: boolean;
}

export default function EditModulePage({
  moduleInitialValue,
  deleteModule,
  updateModule,
  updateLoading
}: EditModulePageProps) {

  const navigate = useNavigate();

  const [module, setModule] = useImmer<Module>(moduleInitialValue);

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

  const trainingModDeletedAnimation = () => {
    toast.error('Training Module Deleted', {
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
    await updateModule(module);

    trainingModSavedAnimation();

    navigate(`/admin/training`)
  }

  const handleDeleteClicked = async () => {
    if (!window.confirm("Are you sure you want to delete this module?")) {
      return;
    }

    await deleteModule();

    trainingModDeletedAnimation();
  }

  const handleAddQuizItem = (item: QuizItem) => {
    setModule((draft) => {
      draft?.quiz.push(item);
    });
  };

  const handleRemoveQuizItem = (itemId: string) => {
    setModule((draft) => {
      const index = draft!.quiz.findIndex((i) => i.id === itemId);
      draft?.quiz.splice(index, 1);
    });
  };

  const handleUpdateQuizItem = (itemId: string, updatedItem: QuizItem) => {
    setModule((draft) => {
      const index = draft!.quiz.findIndex((i) => i.id === itemId);
      draft!.quiz[index] = updatedItem;
    });
  };

  const handleOnDragEnd = (result: DropResult) => {
    setModule((draft) => {
      if (!result.destination) return;
      const [removed] = draft!.quiz.splice(result.source.index, 1);
      draft!.quiz.splice(result.destination.index, 0, removed);
    });
  };

  return (
    <Stack margin="0 20px 20px">
      <title>Edit Training | Make @ RIT</title>
      <Typography variant="h4" textAlign="center">Edit {module.name}</Typography>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={2}
        padding="15px"
      >
        <TextField
          label="Module title"
          value={module.name}
          onChange={(e) => setModule((draft) => {
            draft.name = e.target.value;
          })}
          sx={{ width: "600px" }}
        />
        <Select label="Associated Makerspace" sx={{ width: "600px" }}>

        </Select>
        {
          module.archived
            ? <PublishTrainingModuleButton moduleID={module.id} appearance="large" />
            : <ArchiveTrainingModuleButton moduleID={module.id} appearance="large" />
        }
      </Stack>
      <Fab
        onClick={handleSaveClicked}
        color="primary"
        variant="extended"
        sx={{
          margin: 0,
          top: "auto",
          right: 30,
          bottom: 30,
          left: "auto",
          position: "fixed",
        }}
      >
        {
          updateLoading ? (
            <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
          ) : (
            <SaveIcon sx={{ mr: 1 }} />
          )
        }
        Save
      </Fab>
      <QuizBuilder quiz={module.quiz ? module.quiz : []} handleAdd={handleAddQuizItem} handleRemove={handleRemoveQuizItem} handleUpdate={handleUpdateQuizItem} handleOnDragEnd={handleOnDragEnd} />
    </Stack>
  );
}
