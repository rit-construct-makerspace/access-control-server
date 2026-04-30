import { Button, Card, Stack, Typography } from "@mui/material";
import PrettyModal from "../../../common/PrettyModal";
import { Reservation } from "../../../types/Reservation";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { isManager, isManagerOrSelf, isStaffOrSelf } from "../../../common/PrivilegeUtils";
import { useMutation } from "@apollo/client/react";
import { DELETE_RESERVATION, SET_RESERVATION_APPROVAL } from "../../../queries/reservationQueries";
import { toast } from "react-toastify";

interface ReservationModalProps {
  open: boolean,
  onClose: () => void,
  reservation: Reservation | undefined
}

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "long",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

export default function ReservationModal(props: ReservationModalProps) {
  const user = useCurrentUser();

  const [setReservationApproval] = useMutation(SET_RESERVATION_APPROVAL, { refetchQueries: ["Reservations"] });
  const [deleteReservation] = useMutation(DELETE_RESERVATION, { refetchQueries: ["Reservations"] });

  function handleReservationApproval() {
    if (!props.reservation) {
      return;
    }

    try {
      setReservationApproval({
        variables: {
          id: props.reservation.id,
          approve: !props.reservation.approved
        }
      })
    } catch (e) {
      toast.error("Failed to modify approval: " + e);
    }

    toast.success(`Reservation ${props.reservation.approved ? "Unapproved" : "Approved"}`)
    props.onClose();
  }

  function handleDeleteReservation() {
    if (!props.reservation) {
      return;
    }

    try {
      deleteReservation({
        variables: {
          id: props.reservation.id
        }
      })
    } catch (e) {
      toast.error("Failed to delete reservation: " + e);
    }

    toast.success("Deleted Reservation")
    props.onClose();
  }

  if (props.reservation === undefined) {
    return;
  }

  return (
    <PrettyModal open={props.open} onClose={props.onClose} width={"500px"}>
      <Stack spacing={2}>
        {
          isStaffOrSelf(user, Number(props.reservation.user.id))
            ? <Typography variant="h5">{`${props.reservation.user.firstName}'s (${props.reservation.user.ritUsername}) ${props.reservation.equipment.name} Reservation`}</Typography>
            : <Typography variant="h5">{`${props.reservation.equipment.name} Reservation`}</Typography>
        }
        <Card sx={{ width: "100%", padding: "10px" }} elevation={5}>
          <Stack spacing={2}>
            <Stack direction={"row"} justifyContent={"space-between"}>
              <Typography fontWeight={"bold"}>From:</Typography>
              <Typography>{formatter.format(Number(props.reservation.start))}</Typography>
            </Stack>
            <Stack direction={"row"} justifyContent={"space-between"}>
              <Typography fontWeight={"bold"}>To:</Typography>
              <Typography>{formatter.format(Number(props.reservation.end))}</Typography>
            </Stack>
          </Stack>
        </Card>
        {
          (isStaffOrSelf(user, Number(props.reservation.user.id)) && props.reservation.description !== "")
            ? <Stack>
              <Typography variant="subtitle1">Description:</Typography>
              <Typography>{props.reservation.description}</Typography>
            </Stack>
            : null
        }
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Button
            color="info"
            variant="contained"
            onClick={props.onClose}
          >
            Close
          </Button>
          <Stack direction={"row"} spacing={2}>
            {
              isManager(user) ?
                <Button
                  color={props.reservation.approved ? "warning" : "success"}
                  variant="contained"
                  onClick={handleReservationApproval}
                >
                  {props.reservation.approved ? "Unapprove" : "Approve"}
                </Button>
                : null
            }
            {
              isManagerOrSelf(user, Number(props.reservation.user.id)) ?
                <Button
                  color="error"
                  variant="contained"
                  onClick={handleDeleteReservation}
                >
                  Delete
                </Button>
                : null
            }
          </Stack>
        </Stack>
      </Stack>
    </PrettyModal>
  );
}