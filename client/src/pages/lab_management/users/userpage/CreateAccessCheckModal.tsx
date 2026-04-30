import { Autocomplete, Button, Stack, TextField, Typography } from "@mui/material";
import PrettyModal from "../../../../common/PrettyModal";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ALL_EQUIPMENTS } from "../../../../queries/equipmentQueries";
import { useState } from "react";
import { GET_USER } from "../../../../queries/userQueries";
import RequestWrapper2 from "../../../../common/RequestWrapper2";
import Equipment from "../../../../types/Equipment";


const CREATE_CHECK = gql`
  mutation CreateAccessCheck($userID: ID!, $equipmentID: ID!) {
    createAccessCheck(userID: $userID, equipmentID: $equipmentID)
  }
`;

interface CreateAccessCheckModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
}

export default function CreateAccessCheckModal(props: CreateAccessCheckModalProps) {

  const [newCheckEquipmentID, setNewCheckEquipmentID] = useState<string>();

  const getEquipment = useQuery(GET_ALL_EQUIPMENTS);
  const [createCheck] = useMutation(CREATE_CHECK, { refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });

  function handleCreateAccessCheckModalClose() {
    props.onClose();
  }

  function handleCheckCreate() {
    if (!newCheckEquipmentID) return;
    createCheck({ variables: { userID: props.user.id, equipmentID: newCheckEquipmentID } });
    handleCreateAccessCheckModalClose();
  }

  return (
    <PrettyModal open={props.open} onClose={handleCreateAccessCheckModalClose}>
      <Stack spacing={2}>
        <Typography variant="h5">Create Access Check</Typography>
        <Stack direction={"row"}>
          <RequestWrapper2 result={getEquipment} render={(data) => {
            const equipments: any[] = [];
            data?.allEquipment.forEach((equipment: Equipment) => {
              equipments.push({ label: equipment.name, item: equipment, id: equipment.id })
            });
            const sortedEquipment = equipments.sort((a, b) => (a.label.toLowerCase().localeCompare(b.label.toLowerCase())));

            return (
              <Autocomplete
                options={sortedEquipment}
                sx={{ width: "100%" }}
                onChange={(_e, v, _r) => setNewCheckEquipmentID(v.id)}
                renderInput={(params) => <TextField {...params} label="Search Item" onFocus={event => { event.target.select() }} />}
              />
            )
          }}>
          </RequestWrapper2>
        </Stack>
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Button variant="outlined" color="error" onClick={handleCreateAccessCheckModalClose}>Cancel</Button>
          <Button variant="outlined" color="success" onClick={handleCheckCreate}>Create</Button>
        </Stack>
      </Stack>
    </PrettyModal>
  )
}