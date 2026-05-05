import { Alert, AlertTitle, Button, Card, Link, Paper, Stack, TextField, ThemeProvider, Typography } from "@mui/material";
import { useParams } from "react-router";
import { Calendar, dateFnsLocalizer, SlotInfo, Event } from "react-big-calendar";
import rawWithDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { fallbackTheme } from "../../../types/site_settings/ThemeController";
import { useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import InsertInvitationIcon from '@mui/icons-material/InsertInvitation';
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { useMutation, useQuery } from "@apollo/client/react";
import { CREATE_RESERVATION, GET_RESERVATIONS_FLEXIBLY } from "../../../queries/reservationQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { toast } from "react-toastify";
import { Reservation, ReservationEvent } from "../../../types/Reservation";
import ReservationModal from "./ReservationModal";
import { GET_EQUIPMENT_BY_ID } from "../../../queries/equipmentQueries";
import { isStaff, isStaffOrSelf } from "../../../common/PrivilegeUtils";
import Equipment from "../../../types/Equipment";
import NotFoundPage from "../../../pages/NotFoundPage";
import { addDays, endOfDay, isAfter, startOfDay } from "date-fns";
import { useMakeTheme } from "../../../common/MakeThemeProvider";

const withDragAndDrop = (() => {
  let fn: any = rawWithDragAndDrop;
  while (fn && typeof fn !== 'function') {
    fn = fn.default;
  }

  return fn;
})();
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
  const { equipmentID } = useParams<{ makerspaceID: string, equipmentID: string }>();
  const user = useCurrentUser();
  const makeTheme = useMakeTheme();

  const lightTheme = fallbackTheme.getTheme();

  const getReservationsResult = useQuery(GET_RESERVATIONS_FLEXIBLY, {
    variables: {
      range: {
        start: localizer.startOf(new Date(), "week", 0).toISOString(),
        end: localizer.endOf(new Date(), "week", 0).toISOString()
      },
      equipmentIDs: [Number(equipmentID)]
    }
  });

  const getEquipmentById = useQuery(GET_EQUIPMENT_BY_ID, { variables: { id: equipmentID } })

  const [createReservation] = useMutation(CREATE_RESERVATION, { refetchQueries: ["Reservations"] });

  const [draftReservation, setDraftReservation] = useState<Event>({ title: "Draft Reservation", start: undefined, end: undefined });
  const selectionMade = draftReservation.start !== undefined && draftReservation.end !== undefined;

  const [description, setDescription] = useState("");

  function handleSlotSelect(selection: SlotInfo) {
    if (selection.action === "select") {
      setDraftReservation({ ...draftReservation, start: selection.start, end: selection.end })
    }
  }

  function handleEventDrop(drop: { event: Event, start: Date, end: Date, isAllDay: boolean }) {
    if (drop.event.title === "Draft Reservation") {
      setDraftReservation({ ...draftReservation, start: drop.start, end: drop.end });
    }
  }

  function handleEventResize(resize: { event: Event, start: Date, end: Date }) {
    if (resize.event.title === "Draft Reservation") {
      setDraftReservation({ ...draftReservation, start: resize.start, end: resize.end });
    }
  }

  function validDates(): boolean {
    if (draftReservation.start === undefined) {
      return false;
    }

    return isAfter(startOfDay(draftReservation.start), endOfDay(addDays(new Date(), 2)));
  }

  async function handleSubmitReservation() {
    if (!selectionMade) return;
    if (!validDates()) {
      toast.error("Reservations must be made at least 3 days in advance!")
      return;
    }
    try {
      await createReservation({
        variables: {
          userID: Number(user.id),
          equipmentID: Number(equipmentID),
          start: draftReservation.start?.toISOString(),
          end: draftReservation.end?.toISOString(),
          description: description
        }
      });
    } catch (e) {
      toast.error("Failed to request reservation: " + e);
      return;
    }

    toast.success("Request made!");
    setDraftReservation({ ...draftReservation, start: undefined, end: undefined });
    setDescription("");
  }

  function eventPropGetter(event: ReservationEvent, _start: Date, _end: Date, _isSelected: boolean) {
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

  function handleRangeChange(dates: Date[]) {
    getReservationsResult.refetch({
      range: {
        start: localizer.startOf(dates[0], "day").toISOString(),
        end: localizer.endOf(dates[6], "day").toISOString()
      },
      equipmentIDs: [Number(equipmentID)]
    });
  }

  const [targetReservation, setTargetReservation] = useState<Reservation>();
  const [reservationModal, setReservationModal] = useState(false);
  function handleEventSelect(event: ReservationEvent) {
    if (event.title?.toString().includes("Draft") || (event.reservation.user ?? undefined) === undefined) {
      return;
    }

    setTargetReservation(event.reservation);
    setReservationModal(true);
  }

  return (
    <RequestWrapper2 result={getEquipmentById} render={(data) => {
      const equipment: Equipment = data.equipment;

      if (!equipment.schedulable && !equipment.byReservationOnly) {
        return <NotFoundPage />
      }

      return (
        <RequestWrapper2 result={getReservationsResult} render={(data) => {
          const liveReservationEvents: ReservationEvent[] = data.reservations.map(
            (reservation: Reservation) => {
              return {
                title: isStaffOrSelf(user, Number(reservation.user?.id ?? -1))
                  ? <Stack>
                    <Typography variant="body1">{`${reservation.user.firstName}${isStaff(user) ? " (" + reservation.user.ritUsername + ")" : ""}`}</Typography>
                    <Typography variant="subtitle1">{reservation.approved ? "[Approved]" : "(Pending)"}</Typography>
                    <Typography variant="body2">{reservation.description}</Typography>
                  </Stack>
                  : <Stack>
                    <Typography variant="subtitle1">{reservation.approved ? "[Approved]" : "(Pending)"}</Typography>
                  </Stack>,
                start: new Date(Number(reservation.start)),
                end: new Date(Number(reservation.end)),
                isDraggable: false,
                reservation: reservation,
              }
            }
          );

          return (
            <Stack direction={"row"} padding={"20px"} spacing={4} width={"100%"}>
              <title>{`Reserve ${equipment.name} | ${makeTheme.title}`}</title>
              <Stack width={"20%"} spacing={2}>
                <Typography variant="h5" textAlign={"center"}>
                  {equipment.schedulable ? "Requesting a reservation for:" : "Reservations for:"}
                  <Typography variant="inherit">
                    {equipment.name}
                  </Typography>
                </Typography>
                {
                  equipment.schedulable
                    ? <Typography
                      variant="body1"
                      textAlign={"center"}
                      sx={{
                        fontStyle: "italic"
                      }}
                    >
                      To request a reservation, click and drag on the calender to select the time period you would like to reserve.
                      Reservations must be made at least 3 days in advance.
                      Once your request has been submitted, it will be approved or denied by staff.
                    </Typography>
                    : <Typography
                      variant="body1"
                      textAlign={"center"}
                      sx={{
                        fontStyle: "italic"
                      }}
                    >
                      Calendar for reference only, please email <Link href="mailto:make@rit.edu" color="primary" rel="noopener noreferrer">make@rit.edu</Link> to schedule this equipment.
                    </Typography>
                }
                {
                  selectionMade ?
                    <Stack spacing={2}>
                      <Card sx={{ width: "100%", padding: "10px" }}>
                        <Stack spacing={2}>
                          <Stack direction={"row"} justifyContent={"space-between"}>
                            <Typography fontWeight={"bold"}>From:</Typography>
                            <Typography>{formatter.format(draftReservation.start)}</Typography>
                          </Stack>
                          <Stack direction={"row"} justifyContent={"space-between"}>
                            <Typography fontWeight={"bold"}>To:</Typography>
                            <Typography>{formatter.format(draftReservation.end)}</Typography>
                          </Stack>
                          {
                            validDates()
                              ? null
                              : <Alert severity="error" variant="filled">
                                <AlertTitle>Invalid Dates</AlertTitle>
                                Reservations must be made at least 3 days in advance!
                              </Alert>
                          }
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
                          onClick={() => {
                            setDraftReservation({ ...draftReservation, start: undefined, end: undefined });
                            setDescription("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          color="secondary"
                          variant="contained"
                          startIcon={<InsertInvitationIcon />}
                          onClick={() => handleSubmitReservation()}
                        >
                          Request
                        </Button>
                      </Stack>
                    </Stack>
                    : null
                }
              </Stack>
              {/* The calendar CSS does not like dark mode, so we wrap it in light theme and put in on a <Paper/> to ensure it is legible */}
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
                    eventPropGetter={eventPropGetter}
                    onSelectSlot={equipment.schedulable ? handleSlotSelect : undefined}
                    events={[...liveReservationEvents, { ...draftReservation, isDraggable: true }]}
                    onSelectEvent={handleEventSelect}
                    onRangeChange={handleRangeChange}
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventResize}
                    draggableAccessor={"isDraggable"}
                  />
                </Paper>
              </ThemeProvider>
              <ReservationModal open={reservationModal} onClose={() => setReservationModal(false)} reservation={targetReservation} />
            </Stack >
          );
        }} />
      )
    }} />
  );
}