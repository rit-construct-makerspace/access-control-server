import { useMutation, useQuery } from "@apollo/client";
import { Button, Stack, TextField, Typography } from "@mui/material";
import { GET_EQUIPMENT_BY_ID } from "../../../queries/equipmentQueries";
import { useParams } from "react-router-dom";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import EquipmentInformation from "./EquipmentInformation";
import PrettyModal from "../../../common/PrettyModal";
import InstanceGrid from "../../lab_management/manage_equipment/InstanceGrid";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import { CREATE_EQUIPMENT_INSTANCE } from "../../../queries/equipmentInstanceQueries";

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
    makerspace: {
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
  const isMobile = useIsMobile();

  const getEquipmentByIDResult = useQuery(GET_EQUIPMENT_BY_ID, {
    variables: {
      id: equipmentID,
    },
  });

  const [createInstance] = useMutation(CREATE_EQUIPMENT_INSTANCE, {
    refetchQueries: ["EquipmentInstances"]
  });

  const [newInstanceName, setNewInstanceName] = useState("");
  const [newInstanceModal, setNewInstanceModal] = useState(false);

  function handleCloseNewInstance() {
    setNewInstanceModal(false);
    setNewInstanceName("");
  }

  async function handleSubmitNewInsatance() {
    setNewInstanceModal(false)
    await createInstance({ variables: { equipmentID: equipmentID, name: newInstanceName } })
  }

  return (
    <RequestWrapper2 result={getEquipmentByIDResult} render={(data) => {

      const equipment: Equipment = data.equipment;

      return (

        <Stack padding={"0 20px 15px"} spacing={3}>
          <title>{`Edit ${equipment.name} | Make @ RIT`}</title>
          <Stack>
            <Stack direction="row" spacing={2} alignItems="center" padding="10px">
              <Typography variant="h5" fontWeight={"bold"}>Instances</Typography>
              <Button variant="contained" startIcon={<AddIcon />} color="success" onClick={() => { setNewInstanceModal(true) }}>
                Create New Instance
              </Button>
            </Stack>
            <PrettyModal open={newInstanceModal} onClose={handleCloseNewInstance}>
              <Stack width="auto" spacing={2}>
                <Typography variant="h4">Create New Instance</Typography>
                <TextField
                  label="Name"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                />
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleCloseNewInstance}
                  >
                    Cancel
                  </Button>
                  <Button variant="contained" color="success" onClick={handleSubmitNewInsatance}>Submit</Button>
                </Stack>
              </Stack>
            </PrettyModal>
            <InstanceGrid equipmentID={equipment.id ?? 0} isMobile={isMobile} />
          </Stack>
          <EquipmentInformation equipment={equipment} />
        </Stack>
      );
    }} />
  );
}