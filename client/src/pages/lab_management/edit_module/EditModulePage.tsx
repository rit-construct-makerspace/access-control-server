import QuizBuilder from "./quiz/QuizBuilder";
import {
  CircularProgress,
  Fab,
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
import { useImmer } from "use-immer";
import { Module, QuizItem } from "../../../types/Quiz";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PublishTrainingModuleButton from "../training_modules/PublishTrainingModuleButton";
import ArchiveTrainingModuleButton from "../training_modules/ArchiveTrainingModuleButton";
import { DropResult } from "@hello-pangea/dnd";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { FullMakerspace, GET_FULL_MAKERSPACES } from "../../../queries/makerspaceQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { isAdmin, isManagerFor } from "../../../common/PrivilegeUtils";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
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
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const theme = useTheme();

  const [module, setModule] = useImmer<Module>(moduleInitialValue);

  const getMakerspacesResult = useQuery(GET_FULL_MAKERSPACES);

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

    navigate(`/makerspace/${makerspaceID}/trainings`)
  }
  // we should be able to delete soon
  // eslint-disable-next-line
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
        {
          module.archived
            ? <PublishTrainingModuleButton moduleID={module.id} appearance="large" />
            : <ArchiveTrainingModuleButton moduleID={module.id} appearance="large" />
        }
        <Fab
          onClick={handleSaveClicked}
          color="secondary"
          variant="extended"
          size="large"
          sx={{
            margin: 0,
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
      </Stack>
      <QuizBuilder quiz={module.quiz ? module.quiz : []} handleAdd={handleAddQuizItem} handleRemove={handleRemoveQuizItem} handleUpdate={handleUpdateQuizItem} handleOnDragEnd={handleOnDragEnd} />
    </Stack >
  );
}
