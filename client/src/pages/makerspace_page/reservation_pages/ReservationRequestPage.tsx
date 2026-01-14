import { Box, Button, Card, Paper, Stack, TextField, ThemeProvider, Typography } from "@mui/material";
import { useParams } from "react-router";
import { Calendar, dateFnsLocalizer, SlotInfo, Event } from "react-big-calendar";
import withDragAndDrop, { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'; // if using DnD
import { LightTheme } from "../../../Theme";
import { useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { useCurrentUser } from "../../../common/CurrentUserProvider";

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

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "long",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

export default function ReservationRequestPage() {
  const { makerspaceID, equipmentID } = useParams<{ makerspaceID: string, equipmentID: string }>();
  const user = useCurrentUser();

  const [start, setStart] = useState<Date | undefined>(undefined);
  const [end, setEnd] = useState<Date | undefined>(undefined);
  const selectionMade = start !== undefined && end !== undefined;

  const [description, setDescription] = useState("");

  const [events, setEvents] = useState<Event[]>([]);

  function handleSlotSelect(selection: SlotInfo) {
    if (selection.action === "select") {
      setStart(selection.start);
      setEnd(selection.end);

      setEvents([...events, { title: "Draft Reservation", start: selection.start, end: selection.end }]);
    }

  }

  function handleEventDrop(drop: { event: Event, start: Date, end: Date, isAllDay: boolean }) {
    if (drop.event.title === "Draft Reservation") {
      setStart(drop.start);
      setEnd(drop.end);
      setEvents(events.map(
        (one_event) => {
          if (one_event.title === drop.event.title) {
            return { start: drop.start, end: drop.end, title: one_event.title };
          } else {
            return one_event;
          }
        }
      ));
    }
  }

  function handleEventResize(resize: { event: Event, start: Date, end: Date }) {
    if (resize.event.title === "Draft Reservation") {
      setStart(resize.start);
      setEnd(resize.end);
      setEvents(events.map(
        (one_event) => {
          if (one_event.title === resize.event.title) {
            return { start: resize.start, end: resize.end, title: one_event.title };
          } else {
            return one_event;
          }
        }
      ));
    }
  }

  return (
    <Stack direction={"row"} padding={"20px"} spacing={4} width={"100%"}>
      <Stack width={"20%"} spacing={2}>
        <Typography variant="h5" textAlign={"center"}>{`Requesting a reservation for\n${"{equipment name}"}`}</Typography>
        {
          selectionMade ?
            <Stack spacing={2}>
              <Card sx={{ width: "100%", padding: "10px" }}>
                <Stack spacing={2}>
                  <Stack direction={"row"} justifyContent={"space-between"}>
                    <Typography fontWeight={"bold"}>From:</Typography>
                    <Typography>{formatter.format(start)}</Typography>
                  </Stack>
                  <Stack direction={"row"} justifyContent={"space-between"}>
                    <Typography fontWeight={"bold"}>To:</Typography>
                    <Typography>{formatter.format(end)}</Typography>
                  </Stack>
                </Stack>
              </Card>
              <TextField
                multiline
                rows={3}
                placeholder="Description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Stack direction={"row"} justifyContent={"space-between"}>
                <Button
                  color="error"
                  variant="contained"
                  startIcon={<CloseIcon />}
                  onClick={() => { setStart(undefined); setEnd(undefined); setDescription("") }}
                >
                  Cancel
                </Button>
                <Button
                  color="success"
                  variant="contained"
                  startIcon={<CheckIcon />}
                  onClick={() => {/* Submit Event */ }}
                >
                  Confirm
                </Button>
              </Stack>
            </Stack>
            : null
        }
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
            defaultView={"week"}
            views={["week"]}
            selectable={true}
            step={15}
            timeslots={2}
            scrollToTime={new Date((new Date()).setHours(9, 0, 0, 0))}
            style={{
              height: 800
            }}
            onSelectSlot={handleSlotSelect}
            events={events}
            // @ts-ignore
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
          />
        </Paper>
      </ThemeProvider>
    </Stack >
  );
}