import { CardActionArea, IconButton, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import PublishTrainingModuleButton from "./PublishTrainingModuleButton";
import ArchiveTrainingModuleButton from "./ArchiveTrainingModuleButton";
import { TrainingModule } from "../../../common/TrainingModuleUtils";
import DeleteIcon from '@mui/icons-material/Delete';
import { DELETE_MODULE } from "../../../queries/trainingQueries";
import { useMutation } from "@apollo/client";
import { toast } from "react-toastify";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { isManagerFor } from "../../../common/PrivilegeUtils";

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
          ? <PublishTrainingModuleButton moduleID={module.id} appearance="icon-only" />
          : <ArchiveTrainingModuleButton moduleID={module.id} appearance="icon-only" />
      }
      {
        module.archived
          ? <IconButton
            color="error"
            onClick={handleDeleteModule}
            disabled={!isManagerFor(user, Number(makerspaceID ?? -1))}
          >
            <DeleteIcon />
          </IconButton>
          : null
      }
    </Stack>
  );
}
