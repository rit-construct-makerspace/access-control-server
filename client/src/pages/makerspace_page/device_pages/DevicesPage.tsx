import { useParams } from "react-router-dom";

export default function DevicesPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();


}