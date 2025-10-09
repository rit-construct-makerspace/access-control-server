import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useNavigate, useParams } from "react-router-dom";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { Button } from "@mui/material";

const GET_EQUIPMENT_MAKERSPACE = gql`
  query GetEquipmentMakerspace($id: ID!) {
    equipment(id: $id) {
      room {
        makerspace {
          id
        }
      }
    }
  }
`;

export default function EquipmentRedirector() {
  const { equipmentID } = useParams<{ equipmentID: string }>();

  const navigate = useNavigate();

  const getEquipmentMakerspaceResult = useQuery(GET_EQUIPMENT_MAKERSPACE, { variables: { id: equipmentID } });

  return (
    <RequestWrapper2 result={getEquipmentMakerspaceResult} render={(data) => {
      navigate(`/makerspace/${data.equipment.room.makerspace.id}/equipment/${equipmentID}`);
      return (
        <Button variant="contained" onClick={() => navigate("/")}>You shouldn't be here</Button>
      );
    }} />
  );
}