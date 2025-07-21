import { CardActionArea, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ObjectSummary } from "../../../types/Common";
import PublishTrainingModuleButton from "./PublishTrainingModuleButton";
import ArchiveTrainingModuleButton from "./ArchiveTrainingModuleButton";
import { TrainingModule } from "../../../common/TrainingModuleUtils";

interface TrainingModuleProps {
  module: TrainingModule;
}

export default function TrainingModuleRow({ module }: TrainingModuleProps) {
  const navigate = useNavigate();
  const url = module.archived ? "/admin/training/archived/" + module.id : "/admin/training/" + module.id

  return (
    <CardActionArea
      sx={{
        p: 1,
        pl: 2
      }}
      onClick={() => navigate(url)}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography
          variant="body1"
          fontWeight={500}
          component="div"
          flexGrow={1}
        >
          {module.name}
        </Typography>
        {
          module.archived
            ? <PublishTrainingModuleButton moduleID={module.id} appearance="icon-only" />
            : <ArchiveTrainingModuleButton moduleID={module.id} appearance="icon-only" />
        }
      </Stack>
    </CardActionArea>
  );
}
