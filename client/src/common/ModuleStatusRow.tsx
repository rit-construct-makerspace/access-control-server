import { CardActionArea, Link, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ModuleStatus } from "./TrainingModuleUtils";
import WarningIcon from "@mui/icons-material/Warning";
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import LockClockIcon from '@mui/icons-material/LockClock';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

interface ModuleStatusRowProps {
  ms: ModuleStatus
}

export default function ModuleStatusRow(props: ModuleStatusRowProps) {
  const navigate = useNavigate();

  return (
    <CardActionArea onClick={() => navigate(`/maker/training/${props.ms.moduleID}`)} sx={{ width: "unset" }}>
      <Stack direction="row" spacing={1} alignItems="center" padding="10px" width="100%">
        {
          props.ms.status === "Passed"
            ? <CheckCircleIcon color="success" />
            : props.ms.status === "Not taken"
              ? <CloseIcon color="error" />
              : props.ms.status === "Expired"
                ? <WarningIcon color="warning" />
                : props.ms.status === "Expiring Soon"
                  ? <HourglassBottomIcon color="warning" />
                  : props.ms.status === "Locked"
                    ? <LockClockIcon color="error" />
                    : null
        }
        <Link variant="body2" color="primary" width={"stretch"}>{props.ms.moduleName}</Link>
      </Stack>
    </CardActionArea>
  );
}