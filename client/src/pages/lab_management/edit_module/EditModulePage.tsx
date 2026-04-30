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
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import { useImmer } from "use-immer";
import { Module, QuizItem, QuizItemType } from "../../../types/Quiz";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DropResult } from "@hello-pangea/dnd";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client/react";
import { FullMakerspace, GET_FULL_MAKERSPACES } from "../../../queries/makerspaceQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { isAdmin, isManagerFor } from "../../../common/PrivilegeUtils";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { useCallback } from "react";
import { useIsMobile } from "../../../common/IsMobileProvider";
import GET_TRAINING_MODULES, { ARCHIVE_MODULE, GET_ARCHIVED_TRAINING_MODULES, GET_MODULE, PUBLISH_MODULE } from "../../../queries/trainingQueries";
import { useMakeTheme } from "../../../common/MakeThemeProvider";

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
}: EditModulePageProps) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useIsMobile();
  const makeTheme = useMakeTheme();

  const [module, setModule] = useImmer<Module>(moduleInitialValue);
  const queryResult = useQuery(GET_MODULE, { variables: { id: module.id } });
  const getMakerspacesResult = useQuery(GET_FULL_MAKERSPACES);

  const [publishModule] = useMutation(PUBLISH_MODULE, {
    variables: { id: module.id },
    refetchQueries: [
      { query: GET_TRAINING_MODULES },
      { query: GET_ARCHIVED_TRAINING_MODULES },
    ],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setModule((draft) => {
        draft.archived = false;
      });
      toast.success("Training Module Published");
      queryResult.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to publish training module: ${error.message}`);
    },
  });
  const [archiveModule] = useMutation(ARCHIVE_MODULE, {
    variables: { id: module.id },
    refetchQueries: [
      { query: GET_TRAINING_MODULES },
      { query: GET_ARCHIVED_TRAINING_MODULES },
    ],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setModule((draft) => {
        draft.archived = true;
      });
      toast.success("Training Module Archived");
      queryResult.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to archive training module: ${error.message}`);
    },
  });

  // Prefer server value for `archived` when available so buttons update after refetch
  const moduleArchived = queryResult?.data?.module?.archived ?? module.archived;

  function hasCorrectAnswers() {
    if (module.quiz.some(
      (question) => {
        // We filter to these types of questions because the 
        if ([QuizItemType.Checkboxes, QuizItemType.MultipleChoice].includes(question.type)) {
          return !question.options?.some((option) => option.correct)
        }
      }
    )) {
      toast.error("All questions must have a correct answer!")
      return false;
    }
    return true;
  }

  const handlePublishClicked = async () => {
    if (!hasCorrectAnswers()) {
      return;
    }
    await updateModule(module);
    await publishModule();
  };

  const handleHideClicked = async () => {
    await archiveModule();
  };

  const handleSaveClicked = async () => {
    if (!hasCorrectAnswers()) {
      return;
    }
    try {
      await updateModule(module);
      toast.success("Training Module Saved");
    } catch (error) {
      toast.error(`Failed to save training module: ${error}`);
    }
  };

  const handleDeleteClicked = async () => {
    if (!window.confirm("Are you sure you want to delete this module?")) {
      return;
    }

    try {
      await deleteModule();
      toast.success("Training Module Deleted");
      navigate(`/makerspace/${makerspaceID}/trainings`);
    } catch (error: any) {
      toast.error(`Failed to delete training module: ${error.message}`);
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
      <title>{`Edit Training | ${makeTheme.title}`}</title>
      <Typography variant="h4" textAlign="center">Edit {module.name}</Typography>
      <Stack
        direction={isMobile ? "column" : "row"}
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
            <FormControl sx={{ width: "600px" }}>
              <InputLabel id="associated-makerspace">Associated Makerspace</InputLabel>
              <Select
                id="associated-makerspace"
                label="Associated Makerspace"
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
        <Stack direction="row" spacing={2}>
          {moduleArchived ? (
            <Button
              startIcon={<UnarchiveIcon />}
              color="success"
              variant="contained"
              onClick={handlePublishClicked}
              size="large"
            >
              Publish
            </Button>
          ) : (
            <Button
              startIcon={<ArchiveIcon />}
              color="primary"
              variant="contained"
              onClick={handleHideClicked}
              size="large"
            >
              Hide
            </Button>
          )}
          <Button
            startIcon={<SaveIcon />}
            color="secondary"
            variant="contained"
            onClick={handleSaveClicked}
            size="large"
          >
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
