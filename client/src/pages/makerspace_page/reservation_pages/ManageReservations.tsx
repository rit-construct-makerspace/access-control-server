import { useParams } from "react-router";


export default function ManageReservations() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
}