import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { useParams } from "react-router";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { Paper, Stack, ThemeProvider } from "@mui/material";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";
import { LightTheme } from "../../../Theme";
import ReservationModal from "./ReservationModal";
import { Reservation, ReservationEvent } from "../../../types/Reservaton";
import { useState } from "react";

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

export default function ManageReservationsPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const lightTheme = (new LightTheme).getTheme();

  const [targetReservation, setTargetReservation] = useState<Reservation>();
  const [reservationModal, setReservationModal] = useState(false);
  function handleEventSelect(event: ReservationEvent) {
    if (event.title?.toString().includes("Draft")) {
      return;
    }

    setTargetReservation(event.reservation);
    setReservationModal(true);
  }

  return (
    <Stack direction={"row"} padding={"20px"} spacing={4} width={"100%"}>
      <Stack width={"20%"} spacing={2}>

      </Stack>
      <ThemeProvider theme={lightTheme}>
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
            // eventPropGetter={eventPropGetter}
            // onSelectSlot={handleSlotSelect}
            // events={[...liveReservationEvents, { ...draftReservation, isDraggable: true }]}
            onSelectEvent={handleEventSelect}
          // onRangeChange={handleRangeChange}
          // // @ts-ignore
          // onEventDrop={handleEventDrop}
          // onEventResize={handleEventResize}
          // draggableAccessor={"isDraggable"}
          />
        </Paper>
      </ThemeProvider>
      <ReservationModal open={reservationModal} onClose={() => setReservationModal(false)} reservation={targetReservation} />
    </Stack>
  );
}