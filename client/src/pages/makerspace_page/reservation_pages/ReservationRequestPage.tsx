import { Box, Paper, Stack, ThemeProvider, Typography } from "@mui/material";
import { useParams } from "react-router";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'; // if using DnD
import { LightTheme } from "../../../Theme";
import { width } from "@mui/system";

const DnDCalendar = withDragAndDrop(Calendar);

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function ReservationRequestPage() {
  const { makerspaceID, equipmentID } = useParams<{ makerspaceID: string, equipmentID: string }>();

  return (
    <Stack direction={"row"} padding={"20px"} spacing={1} width={"100%"}>
      <Stack width={"20%"}>
        <Typography variant="h5" textAlign={"center"}>{`Request a Reservation for\n${"{equipment name}"}`}</Typography>
      </Stack>
      {/* The calendar CSS does not like dark mode, so we wrap it in light theme and put in on a <Paper/> to ensure it is legible */}
      <ThemeProvider theme={(new LightTheme).getTheme()}>
        <Paper
          sx={{
            width: "80%"
          }}
        >
          <DnDCalendar
            localizer={localizer}
            defaultView="week"
            style={{
              height: 700
            }}
          />
        </Paper>
      </ThemeProvider>
    </Stack >
  );
}