import { Button, Card, Stack, Typography } from "@mui/material";
import PrettyModal from "../../../common/PrettyModal";
import { Reservation } from "../../../types/Reservaton";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { isManager } from "../../../common/PrivilegeUtils";

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

  if (props.reservation === undefined) {
    return;
  }

  return (
    <PrettyModal open={props.open} onClose={props.onClose} width={"500px"}>
      <Stack spacing={2}>
        <Typography variant="h5">{`${props.reservation.user.firstName}'s ${props.reservation.equipment.name} Reservation`}</Typography>
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
          props.reservation.description === "" ? null :
            <Stack>
              <Typography variant="subtitle1">Description:</Typography>
              <Typography>{props.reservation.description}</Typography>
            </Stack>
        }
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Button
            color="info"
            variant="contained"
            onClick={props.onClose}
          >
            Cancel
          </Button>
          <Stack direction={"row"} spacing={2}>
            {
              isManager(user) ?
                <Button
                  color={props.reservation.approved ? "warning" : "success"}
                  variant="contained"
                >
                  {props.reservation.approved ? "Unapprove" : "Approve"}
                </Button>
                : null
            }
            {
              user.id === props.reservation.user.id ?
                <Button
                  color="error"
                  variant="contained"
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