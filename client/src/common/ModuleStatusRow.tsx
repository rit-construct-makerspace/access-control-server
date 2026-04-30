import { CardActionArea, Link, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ModuleStatus } from "./TrainingModuleUtils";
import WarningIcon from "@mui/icons-material/Warning";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import LockClockIcon from "@mui/icons-material/LockClock";
import CloseIcon from "@mui/icons-material/Close";
import { format } from "date-fns";
import { useQuery } from "@apollo/client/react";
import { GET_PASSED_SUBMISSION } from "../queries/getSubmissions";
import { useCurrentUser } from "./CurrentUserProvider.js";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckIcon from '@mui/icons-material/Check';

interface ModuleStatusRowProps {
  ms: ModuleStatus;
}

export default function ModuleStatusRow(props: ModuleStatusRowProps) {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const passedSubmission = useQuery(GET_PASSED_SUBMISSION, { variables: { moduleID: props.ms.moduleID } });
  const navigateUrl = !passedSubmission?.data?.passingSubmission?.id
    ? `/maker/training/${props.ms.moduleID}`
    : `/maker/training/${props.ms.moduleID}/results/${passedSubmission?.data?.passingSubmission?.id}`;

  return (
    <CardActionArea onClick={() => navigate(navigateUrl)} sx={{ width: "unset" }}>
      <Stack direction="row" spacing={1} alignItems="center" padding="7px" width="100%">
        {user.visitor ? (
          <RadioButtonUncheckedIcon color="secondary" />
        ) : props.ms.status === "Passed" ? (
          <CheckIcon color="success" />
        ) : props.ms.status === "Not taken" ? (
          <CloseIcon color="error" />
        ) : props.ms.status === "Expired" ? (
          <WarningIcon color="warning" />
        ) : props.ms.status === "Expiring Soon" ? (
          <HourglassBottomIcon color="warning" />
        ) : props.ms.status === "Locked" ? (
          <LockClockIcon color="error" />
        ) : null}
        <Stack direction="column" width="100%">
          <Link variant="body2" color="primary" width={"stretch"}>
            {props.ms.moduleName}
          </Link>
          {props.ms.status === "Passed" || props.ms.status === "Expiring Soon" ? (
            <Typography variant="body2">Expires: {format(new Date(props.ms.expirationDate), "MMM d, yyyy")}</Typography>
          ) : null}
        </Stack>
      </Stack>
    </CardActionArea>
  );
}
