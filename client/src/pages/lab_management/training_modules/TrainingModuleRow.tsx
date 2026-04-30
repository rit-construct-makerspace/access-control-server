import { CardActionArea, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { TrainingModule } from "../../../common/TrainingModuleUtils";
import DeleteIcon from '@mui/icons-material/Delete';
import { ARCHIVE_MODULE, DELETE_MODULE, PUBLISH_MODULE } from "../../../queries/trainingQueries";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { isManagerFor } from "../../../common/PrivilegeUtils";
import PublishIcon from '@mui/icons-material/Publish';
import ArchiveIcon from "@mui/icons-material/Archive";

interface TrainingModuleProps {
  module: TrainingModule;
}

export default function TrainingModuleRow({ module }: TrainingModuleProps) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const navigate = useNavigate();
  const url = `/makerspace/${makerspaceID}/training/${module.id}`;
  const user = useCurrentUser();

  const [deleteTrainingModule] = useMutation(DELETE_MODULE, {
    variables: { id: module.id },
    refetchQueries: ["GetTrainingModules"]
  });
  const [publishTrainingModule] = useMutation(PUBLISH_MODULE, {
    variables: { id: module.id },
    refetchQueries: ["GetTrainingModules"]
  });
  const [archiveTrainingModule] = useMutation(ARCHIVE_MODULE, {
    variables: { id: module.id },
    refetchQueries: ["GetTrainingModules"]
  });

  async function handleDeleteModule() {
    if (!window.confirm("Are you sure you want to delete this training module?")) {
      return;
    }

    try {
      await deleteTrainingModule();
    } catch (error) {
      toast.error(`Failed to delete training module: ${error}`);
      return;
    }
  }

  async function handlePublishModule() {
    try {
      await publishTrainingModule();
    } catch (error) {
      toast.error(`Error publishing module: ${error}`);
      return;
    }

    toast.success("Training Module Published");
  }

  async function handleArchiveModule() {
    try {
      await archiveTrainingModule();
    } catch (e) {
      toast.error(`Error archiving module: ${e}`);
      return;
    }

    toast.success("Training Module Archived");
  }

  return (

    <Stack direction="row" alignItems="center" spacing={2}>
      <CardActionArea
        sx={{
          p: 2,
          pl: 2
        }}
        onClick={() => navigate(url)}
      >
        <Typography
          variant="body1"
          fontWeight={500}
          component="div"
          flexGrow={1}
        >
          {module.name}
        </Typography>
      </CardActionArea>
      {
        module.archived
          ? <Tooltip title={"Publish"}>
            <IconButton
              color="success"
              onClick={handlePublishModule}
              disabled={!isManagerFor(user, Number(makerspaceID ?? -1))}
            >
              <PublishIcon />
            </IconButton>
          </Tooltip>
          : <Tooltip title={"Archive"}>
            <IconButton
              color="warning"
              onClick={handleArchiveModule}
              disabled={!isManagerFor(user, Number(makerspaceID ?? -1))}
            >
              <ArchiveIcon />
            </IconButton>
          </Tooltip>
      }
      {
        module.archived
          ? <Tooltip title={"Delete"}>
            <IconButton
              color="error"
              onClick={handleDeleteModule}
              disabled={!isManagerFor(user, Number(makerspaceID ?? -1))}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          : null
      }
    </Stack>
  );
}
