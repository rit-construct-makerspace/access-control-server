import { useNavigate } from "react-router-dom";
import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
  Tooltip
} from "@mui/material";
import PublishEquipmentButton from "./PublishEquipmentButton";
import ArchiveEquipmentButton from "./ArchiveEquipmentButton";
import SopButton from "../../../common/SopButton";
import LogsButton from "./LogsButton";

interface ArchivedEquipmentCardProps {
  id: number;
  name: string;
  to: string;
  archived: boolean;
  imageUrl: string;
  sopUrl: string;
}

export default function EditableEquipmentCard({ id, name, to, archived, imageUrl, sopUrl }: ArchivedEquipmentCardProps) {
  const navigate = useNavigate();

  return (
    <Card sx={{ width: 250, height: 300 }}>
      <Tooltip title={name} followCursor>
        <CardActionArea onClick={() => navigate(to)}>
          <CardMedia
            component="img"
            height="150"
            image={imageUrl}
          />
          <CardContent>
            <Typography
              variant="h6"
              component="div"
              minHeight="120"
              sx={{ lineHeight: 1, mb: 1 }}
            >
              {name}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Tooltip>
      <CardActions
        sx={{
          minHeight: 0.12,
          justifyContent: "space-between",
          mt: 0,
          padding: 0.25
        }}>
        <Typography
          variant="subtitle1"
          component="div"
          minHeight="120"
          sx={{ lineHeight: 1, mb: 1, paddingLeft: 1 }}
        >
          {"ID " + id}
        </Typography>
        <div>
        {
          (sopUrl && sopUrl !== "")
            ? <SopButton appearance="icon-only" url={sopUrl} disabled={false} toolTipText="View SOP" buttonText="View SOP"></SopButton>
            : <SopButton appearance="icon-only" url={""} disabled={true} toolTipText="No SOP" buttonText="No SOP"></SopButton>
        }
        <LogsButton appearance="icon-only" id={id.toString()}></LogsButton>
        {
          archived
            ? <PublishEquipmentButton equipmentID={id} appearance="icon-only" />
            : <ArchiveEquipmentButton equipmentID={id} appearance="icon-only" />
        }
        </div>
      </CardActions>
    </Card>
  );
}
