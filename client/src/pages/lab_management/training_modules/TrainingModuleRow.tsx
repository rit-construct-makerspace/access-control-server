import { CardActionArea, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import PublishTrainingModuleButton from "./PublishTrainingModuleButton";
import ArchiveTrainingModuleButton from "./ArchiveTrainingModuleButton";
import DeleteTrainingModuleButton from "./DeleteTrainingModuleButton";
import { TrainingModule } from "../../../common/TrainingModuleUtils";

interface TrainingModuleProps {
  module: TrainingModule;
}

export default function TrainingModuleRow({ module }: TrainingModuleProps) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const navigate = useNavigate();
  const url = `/makerspace/${makerspaceID}/training/${module.id}`;

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
      <DeleteTrainingModuleButton moduleID={module.id} appearance="icon-only" />
    </Stack>
  );
}
