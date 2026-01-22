import { IconButton, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import { useParams } from "react-router-dom";
import { ObjectSummary } from "../types/Common";

interface AttachedModuleProps {
  module: ObjectSummary;
  onRemove: () => void;
}

export default function AttachedModule({
  module,
  onRemove,
}: AttachedModuleProps) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{ ":last-child": { mb: 2 } }}
    >
      <Typography sx={{ flex: 1 }}>{module.name}</Typography>
      <IconButton
        aria-label="View module"
        onClick={() => window.open(`/app/makerspace/${makerspaceID}/training/${module.id}`)}
      >
        <OpenInNewIcon />
      </IconButton>
      <IconButton aria-label="Detach module" onClick={onRemove}>
        <CloseIcon />
      </IconButton>
    </Stack>
  );
}
