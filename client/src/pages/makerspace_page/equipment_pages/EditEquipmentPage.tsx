import { useQuery } from "@apollo/client";
import { Stack } from "@mui/material";
import { GET_EQUIPMENT_BY_ID } from "../../../queries/equipmentQueries";
import { useParams } from "react-router-dom";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import EquipmentInformation from "./EquipmentInformation";

export interface Equipment {
  id: number;
  name: string;
  archived: boolean;
  imageUrl: string;
  sopUrl: string;
  notes: string;
  numAvailable: number;
  numInUse: number;
  byReservationOnly: boolean;
  needsWelcome: boolean;
  requiresTrainerApproval: boolean;
  room: {
    id: number;
    name: string;
    zone: {
      id: number;
      name: string;
    };
  };
  trainingModules: {
    id: number;
    name: string;
    archived: boolean;
  }[];

}

export default function EditEquipmentPage() {
  const { equipmentID } = useParams<{ equipmentID: string }>();

  const getEquipmentByIDResult = useQuery(GET_EQUIPMENT_BY_ID, {
    variables: {
      id: equipmentID,
    },
  })

  return (
    <RequestWrapper2 result={getEquipmentByIDResult} render={(data) => {

      const equipment: Equipment = data.equipment;

      return (

        <Stack padding={"0 15px 10px"}>
          <title>{`Edit ${equipment.name} | Make @ RIT`}</title>

          <EquipmentInformation equipment={equipment} />
        </Stack>
      );
    }} />
  );
}