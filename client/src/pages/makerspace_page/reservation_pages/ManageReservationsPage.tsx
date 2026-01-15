import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { useParams } from "react-router";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { Autocomplete, Paper, Stack, TextField, ThemeProvider, Typography } from "@mui/material";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";
import { LightTheme } from "../../../Theme";
import ReservationModal from "./ReservationModal";
import { Reservation, ReservationEvent } from "../../../types/Reservation";
import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_RESERVATIONS_FLEXIBLY } from "../../../queries/reservationQueries";
import { FullMakerspace, GET_MAKERSPACE_BY_ID } from "../../../queries/makerspaceQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import Room from "../../../types/Room";
import Equipment from "../../../types/Equipment";

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

const date_formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export default function ManageReservationsPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const lightTheme = (new LightTheme).getTheme();

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);

  const [targetDay, setTargetDay] = useState(new Date());
  const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({
    start: localizer.startOf(targetDay, "day"),
    end: localizer.endOf(targetDay, "day")
  });
  function onNavigate(newDate: Date) {
    setTargetDay(newDate);
  }

  const getReservationsResult = useQuery(GET_RESERVATIONS_FLEXIBLY, {
    variables: {
      range: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      },
      equipmentIDs: selectedEquipment.map((equipment) => Number(equipment.id))
    }
  });

  function handleRangeChange(dates: Date[] | { start: Date, end: Date }) {

    if (Array.isArray(dates)) { // Went to day view
      setTargetDay(dates[0]);
      setDateRange({ start: localizer.startOf(dates[0], "day"), end: localizer.endOf(dates[0], "day") });
    } else { // Went to month view
      setDateRange({ start: dates.start, end: dates.end });
    }
    getReservationsResult.refetch();
  }

  const [view, setView] = useState<string>(Views.DAY);
  function onView(view: string) {
    setView(view);
  }

  const [targetReservation, setTargetReservation] = useState<Reservation>();
  const [reservationModal, setReservationModal] = useState(false);
  function handleEventSelect(event: ReservationEvent) {
    if (event.title?.toString().includes("Draft")) {
      return;
    }

    if (view === Views.MONTH) {
      setTargetDay(event.start);
      onView(Views.DAY);
      return;
    }

    setTargetReservation(event.reservation);
    setReservationModal(true);
  }

  function eventPropGetter(event: ReservationEvent, start: Date, end: Date, isSelected: boolean) {
    if (event.title?.toString().includes("Draft")) {
      return {
        style: {
          backgroundColor: lightTheme.palette.info.main,
          border: "0px"
        }
      }
    } else if (!event.reservation.approved) {
      return {
        style: {
          backgroundColor: lightTheme.palette.secondary.main,
          border: "0px"
        }
      }
    } else {
      return {
        style: {
          backgroundColor: lightTheme.palette.primary.main,
          border: "0px"
        }
      }
    }
  }

  function handleEquipmentSelection(newEquipment: Equipment[]) {
    setSelectedEquipment(newEquipment);
    getReservationsResult.refetch();
  }

  const getMakerspace = useQuery(GET_MAKERSPACE_BY_ID, { variables: { id: makerspaceID } });

  return (
    <RequestWrapper2 result={getMakerspace} render={(data) => {

      const fullSpace: FullMakerspace = data.makerspaceByID;
      const liveRooms = fullSpace.rooms.filter((room: Room) => !room.archived);

      const reservableEquipment = (liveRooms.map((room: Room) => (
        room.equipment.filter((equipment) => (equipment.byReservationOnly || equipment.schedulable))
      ))).flat(1);

      const resources = selectedEquipment.length > 0
        ? reservableEquipment.filter((equipment) => selectedEquipment.includes(equipment)).map((equipment: Equipment) => ({
          resourceId: equipment.id,
          resourceTitle: equipment.name
        }))
        : reservableEquipment.map((equipment: Equipment) => ({
          resourceId: equipment.id,
          resourceTitle: equipment.name
        }));

      return (
        <RequestWrapper2 result={getReservationsResult} render={(data) => {

          const liveReservationEvents: ReservationEvent[] =
            view === Views.MONTH
              ? data.reservations.map(
                (reservation: Reservation) => ({
                  title: <Typography variant="subtitle1">{`${reservation.approved ? "[Approved]" : "(Pending)"} Reservation(s)`}</Typography>,
                  start: localizer.startOf(new Date(Number(reservation.start)), "day"),
                  end: localizer.endOf(new Date(Number(reservation.end)), "day"),
                  reservation: reservation,
                  isDraggable: false,
                  resourceId: reservation.equipment.id
                })
              )
              : data.reservations.map(
                (reservation: Reservation) => ({
                  title: <Stack>
                    <Typography variant="body1">{reservation.user.ritUsername}</Typography>
                    <Typography variant="subtitle1">{reservation.approved ? "[Approved]" : "(Pending)"}</Typography>
                    <Typography variant="body2">{reservation.description}</Typography>
                  </Stack>,
                  start: new Date(Number(reservation.start)),
                  end: new Date(Number(reservation.end)),
                  reservation: reservation,
                  isDraggable: false,
                  resourceId: reservation.equipment.id
                })
              );

          if (view === Views.MONTH) {
            for (let i = liveReservationEvents.length - 1; i >= 0; i--) {
              for (let j = 0; j < liveReservationEvents.length; j++) {
                if (
                  (
                    liveReservationEvents[i].start.toISOString() === liveReservationEvents[j].start.toISOString()
                    || liveReservationEvents[i].end.toISOString() === liveReservationEvents[j].end.toISOString()
                  )
                  && j != i
                  && liveReservationEvents[i].reservation.approved === liveReservationEvents[j].reservation.approved
                ) {
                  liveReservationEvents.splice(i, 1);
                  break;
                }
              }
            }
          }

          return (
            <Stack direction={"row"} padding={"20px"} spacing={4} width={"100%"}>
              <title>{`${fullSpace.name} Reservations`}</title>
              <Stack width={"20%"} spacing={2}>
                <TextField
                  value={format(targetDay, "yyyy-MM-dd")}
                  type="date"
                  label="Date"
                  onChange={(e) => { handleRangeChange([parse(e.target.value, "yyyy-MM-dd", new Date())]); onView(Views.DAY); }}
                />
                <Autocomplete
                  renderInput={
                    (params) => (
                      <TextField
                        {...params}
                        label="Equipment"
                        placeholder="Filter equipment..."
                      />
                    )
                  }
                  options={reservableEquipment}
                  getOptionLabel={(option) => option.name}
                  filterSelectedOptions
                  multiple
                  value={selectedEquipment}
                  onChange={(event: any, newValue: Equipment[]) => handleEquipmentSelection(newValue)}
                />
              </Stack>
              <ThemeProvider theme={lightTheme}>
                <Paper
                  sx={{
                    width: "80%"
                  }}
                >
                  {/* @ts-expect-error */}
                  <DnDCalendar
                    date={targetDay}
                    onNavigate={onNavigate}
                    localizer={localizer}
                    view={view}
                    onView={onView}
                    views={[Views.DAY, Views.MONTH]}
                    selectable={true}
                    step={15}
                    timeslots={2}
                    scrollToTime={new Date((new Date()).setHours(9, 0, 0, 0))}
                    style={{
                      height: 800
                    }}
                    resources={resources}
                    resourceIdAccessor={"resourceId"}
                    resourceTitleAccessor={"resourceTitle"}
                    eventPropGetter={eventPropGetter}
                    events={liveReservationEvents}
                    onSelectEvent={handleEventSelect}
                    onRangeChange={handleRangeChange}
                    draggableAccessor={"isDraggable"}
                  />
                </Paper>
              </ThemeProvider>
              <ReservationModal open={reservationModal} onClose={() => setReservationModal(false)} reservation={targetReservation} />
            </Stack>
          );
        }} />
      );
    }} />
  );
}