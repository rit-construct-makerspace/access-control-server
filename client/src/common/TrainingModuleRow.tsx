import React from "react";
import { CardActionArea, Stack, Typography } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import LockClockIcon from '@mui/icons-material/LockClock';
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ModuleStatus } from "./TrainingModuleUtils";

interface RequiredModuleProps {
  moduleStatus: ModuleStatus;
}

export default function TrainingModuleRow({
  moduleStatus,
}: RequiredModuleProps) {
  const navigate = useNavigate();

  return (
    <CardActionArea
      sx={{ py: 2 }}
      onClick={() => navigate(`/maker/training/${moduleStatus.moduleID}`)}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        {moduleStatus.status === "Passed" && (
          <CheckCircleIcon color="success" />
        )}
        {moduleStatus.status === "Expired" && <WarningIcon color="warning" />}
        {moduleStatus.status === "Not taken" && <CloseIcon color="error" />}
        {moduleStatus.status === "Expiring Soon" && <HourglassBottomIcon color="warning" />}
        {moduleStatus.status === "Locked" && <LockClockIcon color="error" />}

        <Typography
          variant="body2"
          sx={{ width: 80, lineHeight: 1 }}
        >
          {
            moduleStatus.status === "Locked"
              ? "Locked Until Tomorrow"
              : moduleStatus.status
          }
        </Typography>

        <Typography>{moduleStatus.moduleName}</Typography>

        {moduleStatus.status === "Expiring Soon" && (
          <Stack sx={{ ml: "auto !important" }} >
            <Typography variant="body2"
              sx={{ ml: "auto !important" }}>Exp Date:</Typography>
            <Typography
              variant="body2"
              sx={{ ml: "auto !important" }}
            >
              {format(parseISO(moduleStatus.expirationDate), "MM/dd/yyyy")}
            </Typography>
          </Stack>
        )}

        {moduleStatus.status === "Passed" && (
          <Typography
            variant="body2"
            sx={{ ml: "auto !important" }}
          >
            {format(parseISO(moduleStatus.submissionDate), "MM/dd/yyyy")}
          </Typography>
        )}
      </Stack>
    </CardActionArea>
  );
}
