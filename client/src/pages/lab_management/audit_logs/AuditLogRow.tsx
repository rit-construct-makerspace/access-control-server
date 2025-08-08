import { useEffect, useState } from "react";
import { Chip, Stack, SxProps, Typography } from "@mui/material";
import { format, parseISO } from "date-fns";
import reactStringReplace from "react-string-replace";
import AuditLogEntity from "./AuditLogEntity";

const chipSx: SxProps = {p: "3px", width: "min-content", fontSize: "0.75em"}

const categoryChips = {
  welcome: <Chip label="Sign-In" variant="outlined" color="success" size="small" sx={chipSx} />,
  auth: <Chip label="ACS Auth" variant="outlined" color="error" size="small" sx={chipSx} />,
  status: <Chip label="ACS Status" variant="outlined" color="primary" size="small" sx={chipSx} />,
  state: <Chip label="ACS State" variant="outlined" color="primary" size="small" sx={chipSx} />,
  help: <Chip label="Help Request" variant="outlined" color="warning" size="small" sx={chipSx} />,
  message: <Chip label="ACS Message" variant="outlined" color="info" size="small" sx={chipSx} />,
  server: <Chip label="Server" variant="outlined" color="info" size="small" sx={chipSx} />,
  training: <Chip label="Training" variant="outlined" color="secondary" size="small" sx={chipSx} />,
  admin: <Chip label="Admin" variant="outlined" color="primary" size="small" sx={chipSx} />,
  inventory: <Chip label="Inventory" variant="outlined" color="warning" size="small" sx={chipSx} />,
  uncategorized: <></>,
}

interface AuditLogRowProps {
  dateTime: string;
  message: string;
  category: string;
}

function formatDateTime(dateTime: string) {
  return format(parseISO(dateTime), "M/d/yy h:mmaaa").split(" ");
}

export default function AuditLogRow({ dateTime, message, category }: AuditLogRowProps) {
  const [width, setWidth] = useState<number>(window.innerWidth);
  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }
  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    }
  }, []);
  const isMobile = width <= 1100;

  const [date, time] = formatDateTime(dateTime);

  return (
    <Stack direction={isMobile ? "column" : "row"} alignItems={isMobile ? "flex-start" : "center"} px={2}>
      <Stack direction={isMobile ? "row" : "column"}>
        <Stack direction={"row"}>
          <Typography color={localStorage.getItem("themeMode") === "dark" ? "grey.300" : "grey.700"} sx={{ width: 70 }} variant="body2">
            {date}
          </Typography>
          <Typography color={localStorage.getItem("themeMode") === "dark" ? "grey.300" : "grey.700"} sx={{ width: 93 }} variant="body2">
            {time}
          </Typography>
        </Stack>
        <Stack direction={"row"} width={"75%"} justifyContent={"center"}>
          {categoryChips[category as keyof typeof categoryChips]}
        </Stack>
      </Stack>
      <Typography>
        {reactStringReplace(message, /<(\w+?:\d+?:.*?)>/g, (match, i) => (
          <AuditLogEntity key={match + i} entityCode={match} />
        ))}
      </Typography>
    </Stack>
  );
}
