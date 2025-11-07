import { Alert, Button, Chip, MenuItem, Select, Stack, Typography } from "@mui/material"
import ActionButton from "../../../../common/ActionButton"
import { isManager, isStaffFor, isTrainerFor } from "../../../../common/PrivilegeUtils"
import { useCurrentUser } from "../../../../common/CurrentUserProvider";
import { gql, useMutation, useQuery } from "@apollo/client";
import { AccessCheckExtraInfo, GET_USER } from "../../../../queries/userQueries";
import { useState } from "react";
import RequestWrapper from "../../../../common/RequestWrapper";
import { GET_ALL_EQUIPMENTS } from "../../../../queries/equipmentQueries";
import AccessCheckCard from "../AccessCheckCard";

const REFRESH_CHECKS = gql`
  mutation RefreshAccessChecks($userID: ID!) {
    refreshAccessChecks(userID: $userID)
  }
`;

const CREATE_CHECK = gql`
  mutation CreateAccessCheck($userID: ID!, $equipmentID: ID!) {
    createAccessCheck(userID: $userID, equipmentID: $equipmentID)
  }
`;

interface AccessCheckProps {
  user: any;
}

export default function AccessChecks(props: AccessCheckProps) {
  const currentUser = useCurrentUser();

  const [openCreateCheckDialouge, setOpenCreateCheckDialouge] = useState<boolean>();  
  const [newCheckEquipmentID, setNewCheckEquipmentID] = useState<string>();
  

  const getEquipment = useQuery(GET_ALL_EQUIPMENTS);  
  const [refreshCheck, refreshCheckResult] = useMutation(REFRESH_CHECKS, { variables: { userID: props.user.id }, refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });
  const [createCheck] = useMutation(CREATE_CHECK, { refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });
  
  function handleCheckCreate() {
    if (!newCheckEquipmentID) return;
    createCheck({ variables: { userID: props.user.id, equipmentID: newCheckEquipmentID } });
    setOpenCreateCheckDialouge(false);
  }

  const filteredACs: AccessCheckExtraInfo[] = props.user.accessChecks.filter(
    (ac: AccessCheckExtraInfo) => (
      ac.equipment.requiresTrainerApproval
        ? isTrainerFor(currentUser, Number(ac.equipment.id), Number(ac.equipment.room.makerspace.id))
        : (isStaffFor(currentUser, Number(ac.equipment.room.makerspace.id)) || isTrainerFor(currentUser, Number(ac.equipment.id), Number(ac.equipment.room.makerspace.id)))
    )
  );

  return (
    <Stack >
      <Typography variant="h6" component="div" mb={1}>
        Access Checks
      </Typography>

      <Stack direction={"row"} spacing={1}>
        <ActionButton iconSize={5} color="info" appearance={"small"} variant="outlined" handleClick={async () => { refreshCheck() }} loading={refreshCheckResult.loading} buttonText="Refresh Checks" tooltipText="Purge all unapproved checks and repopulate based on currently passed modules." />
        {isManager(currentUser) && <ActionButton iconSize={5} color="primary" appearance={"small"} variant="outlined" handleClick={async () => { setOpenCreateCheckDialouge(!openCreateCheckDialouge) }} loading={false} buttonText="Create Check" />}
      </Stack>
      {openCreateCheckDialouge && <Stack direction={"row"} mt={1}>
        <RequestWrapper loading={getEquipment.loading} error={getEquipment.error}>
          <Select value={newCheckEquipmentID} onChange={(e) => setNewCheckEquipmentID(e.target.value)} sx={{ width: "50%" }}>
            {getEquipment.data?.allEquipment.map((equipment: { id: number, name: string, archived: boolean }) => (
              <MenuItem value={equipment.id}>{equipment.name} {equipment.archived && <Chip variant="outlined" color="warning" size="small" label="hidden" sx={{ ml: "1em" }} />}</MenuItem>
            ))}
          </Select>
        </RequestWrapper>
        <Button variant="outlined" color="success" onClick={handleCheckCreate}>Create</Button>
      </Stack>}

      <Stack spacing={1} mt={2}>
        {filteredACs != null && filteredACs.map((accessCheck: AccessCheckExtraInfo) => (
          <AccessCheckCard key={accessCheck.id} accessCheck={accessCheck} userID={props.user.id} />
        ))}
      </Stack>

      {(filteredACs == null || (filteredACs.length === 0)) && (
        <Alert severity="info">No Access Checks Available</Alert>
      )}

    </Stack>
  )
}