
interface TicketModalProps {
  open: boolean,
  onClose: () => void,
  ticketID: number
}

export default function TicketModal(props: TicketModalProps) {

  const newTicket = typeof props.ticketID === typeof "new";

  if (!newTicket) {

  }

}