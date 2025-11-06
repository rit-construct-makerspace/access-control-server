import QuizBuilder from "./quiz/QuizBuilder";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import { useImmer } from "use-immer";
import { Module, QuizItem } from "../../../types/Quiz";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PublishTrainingModuleButton from "../training_modules/PublishTrainingModuleButton";
import ArchiveTrainingModuleButton from "../training_modules/ArchiveTrainingModuleButton";
import { DropResult } from "@hello-pangea/dnd";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { FullMakerspace, GET_FULL_MAKERSPACES } from "../../../queries/makerspaceQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { isAdmin, isManagerFor } from "../../../common/PrivilegeUtils";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { useCallback } from "react";
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
  updateLoading,
}: EditModulePageProps) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const theme = useTheme();

  const [module, setModule] = useImmer<Module>(moduleInitialValue);

  const getMakerspacesResult = useQuery(GET_FULL_MAKERSPACES);

  const trainingModSavedAnimation = () => {
    toast.success("Training Module Saved", {
      position: "bottom-left",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  };

  const trainingModDeletedAnimation = () => {
    toast.success("Training Module Deleted", {
      position: "bottom-left",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  };

  const handleSaveClicked = async () => {
    await updateModule(module);

    trainingModSavedAnimation();

    navigate(`/makerspace/${makerspaceID}/trainings`);
  };

  const handleDeleteClicked = async () => {
    if (!window.confirm("Are you sure you want to delete this module?")) {
      return;
    }

    try {
      await deleteModule();
      trainingModDeletedAnimation();
      navigate(`/makerspace/${makerspaceID}/trainings`);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to delete training module");
    }
  };

  const handleAddQuizItem = useCallback((item: QuizItem) => {
    setModule((draft) => {
      draft?.quiz.push(item);
    });
  }, [setModule]);

  const handleRemoveQuizItem = useCallback((itemId: string) => {
    setModule((draft) => {
      const index = draft!.quiz.findIndex((i) => i.id === itemId);
      draft?.quiz.splice(index, 1);
    });
  }, [setModule]);

  const handleUpdateQuizItem = useCallback((updatedItem: QuizItem) => {
    setModule((draft) => {
      const index = draft!.quiz.findIndex((i) => i.id === updatedItem.id);
      draft!.quiz[index] = updatedItem;
    });
  }, [setModule]);

  const handleOnDragEnd = useCallback((result: DropResult) => {
    setModule((draft) => {
      if (!result.destination) return;
      const [removed] = draft!.quiz.splice(result.source.index, 1);
      draft!.quiz.splice(result.destination.index, 0, removed);
    });
  }, [setModule]);

  return (
    <Stack margin="0 20px 20px" spacing={2}>
      <title>Edit Training | Make @ RIT</title>
      <Typography variant="h4" textAlign="center">Edit {module.name}</Typography>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={2}
        padding="15px"
        sx={{
          position: "sticky",
          top: "1px",
          backgroundColor: theme.palette.background.default,
          zIndex: 3000,
        }}
      >
        <TextField
          label="Module title"
          value={module.name}
          onChange={(e) => setModule((draft) => {
              draft.name = e.target.value;
          })}
          sx={{ width: "600px" }}
        />
        <RequestWrapper2 result={getMakerspacesResult} render={(data) => {
            const makerspaces = data.makerspaces;
          const possibleMakerspaces = makerspaces.filter((space: FullMakerspace) => (isManagerFor(currentUser, space.id)))
            return (
              <FormControl>
                <InputLabel id="associated-makerspace">Associated Makerspace</InputLabel>
                <Select
                  id="associated-makerspace"
                  label="Associated Makerspace"
                  sx={{ width: "600px" }}
                  value={module.makerspaceID}
                onChange={(e) => setModule((draft) => {
                      draft.makerspaceID = e.target.value != null ? Number(e.target.value) : null;
                })}>
                {
                  possibleMakerspaces.map((space: FullMakerspace) => (
                    <MenuItem value={space.id}>{space.name}</MenuItem>
                  ))
                }
                {
                  isAdmin(currentUser) &&
                  <MenuItem>Unassociate Training</MenuItem>
                }
                </Select>
              </FormControl>
            );
          }}
        />
        {module.archived ? (
          <PublishTrainingModuleButton moduleID={module.id} appearance="large" />
        ) : (
          <ArchiveTrainingModuleButton moduleID={module.id} appearance="large" />
        )}
        <Button startIcon={<SaveIcon />} color="secondary" variant="contained" onClick={handleSaveClicked} size="large">
          Save
        </Button>
        <Button
          startIcon={<DeleteIcon />}
          color="error"
          variant="contained"
          onClick={handleDeleteClicked}
          size="large"
        >
          Delete
        </Button>
      </Stack>
      <QuizBuilder
        quiz={module.quiz ? module.quiz : []}
        handleAdd={handleAddQuizItem}
        handleRemove={handleRemoveQuizItem}
        handleUpdate={handleUpdateQuizItem}
        handleOnDragEnd={handleOnDragEnd}
      />
    </Stack>
  );
}
