import { useMutation, useQuery } from "@apollo/client";
import { Button, Stack, TextField, Typography } from "@mui/material";
import { GET_EQUIPMENT_BY_ID } from "../../../queries/equipmentQueries";
import { useNavigate, useParams } from "react-router-dom";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import EquipmentInformation from "./EquipmentInformation";
import PrettyModal from "../../../common/PrettyModal";
import InstanceGrid from "../../lab_management/manage_equipment/InstanceGrid";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import { CREATE_EQUIPMENT_INSTANCE } from "../../../queries/equipmentInstanceQueries";
import HistoryIcon from '@mui/icons-material/History';
import { isManagerFor } from "../../../common/PrivilegeUtils";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import HandymanIcon from '@mui/icons-material/Handyman';
import MaintenanceTicketRow from "../maintenance_pages/MaintenanceTicketRow";
import WarningIcon from '@mui/icons-material/Warning';
import NewTicketModal from "../maintenance_pages/NewTicketModal";

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
  requiresInPerson: boolean;
  schedulable: boolean;
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
  const { makerspaceID, equipmentID } = useParams<{ makerspaceID: string, equipmentID: string }>();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const user = useCurrentUser();

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

  const [editEquipmentModal, setEditEquipmentModal] = useState(false);

  const [newTicketModal, setNewTicketModal] = useState(false);

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

        <Stack padding={"0 20px 15px"}>
          <title>{`Edit ${equipment.name} | Make @ RIT`}</title>
          <Stack spacing={2}>
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"} padding={"10px"}>
              <Typography variant="h3">{`Edit ${equipment.name}`}</Typography>
              <Stack direction={"row"} spacing={1}>
                <Button
                  color="secondary"
                  variant="contained"
                  startIcon={<HistoryIcon />}
                  onClick={() => navigate(`/makerspace/${makerspaceID}/history?q=<equipment:${equipmentID}:`)}
                  sx={{
                    justifySelf: "flex-end"
                  }}
                >
                  View Logs
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  disabled={!isManagerFor(user, Number(makerspaceID))}
                  startIcon={<HandymanIcon />}
                  onClick={() => setEditEquipmentModal(true)}
                >
                  Edit
                </Button>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h5">Instances</Typography>
              <Button variant="contained" startIcon={<AddIcon />} color="success" onClick={() => { setNewInstanceModal(true) }}>
                Create New Instance
              </Button>
            </Stack>
            {/* New Insatnce Modal */}
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
            <InstanceGrid equipmentID={equipment.id} isMobile={isMobile} />
            <Stack direction={"row"} spacing={2}>
              <Typography variant="h5">Maintenance Tickets</Typography>
              <Button
                color="primary"
                variant="contained"
                onClick={() => setNewTicketModal(true)}
                startIcon={<WarningIcon />}
              >
                Report Issue
              </Button>
            </Stack>
            <MaintenanceTicketRow equipmentID={equipment.id} />
          </Stack>
          {/* Equipment Information Modal */}
          <PrettyModal open={editEquipmentModal} onClose={() => setEditEquipmentModal(false)} width={"90%"} elevation={8}>
            <EquipmentInformation equipment={equipment} />
          </PrettyModal>
          <NewTicketModal open={newTicketModal} onClose={() => setNewTicketModal(false)} equipment={equipment} />
        </Stack>
      );
    }} />
  );
}