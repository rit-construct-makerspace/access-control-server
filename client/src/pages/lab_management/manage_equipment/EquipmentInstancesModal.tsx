import React, { useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery } from "@apollo/client";
import RequestWrapper from "../../../common/RequestWrapper";
import PrettyModal from "../../../common/PrettyModal";
import { CREATE_EQUIPMENT_INSTANCE, EquipmentInstance, GET_EQUIPMENT_INSTANCES } from "../../../queries/equipmentInstanceQueries";
import EquipmentInstanceRow from "./EquipmentInstanceRow";
import { useIsMobile } from "../../../common/IsMobileProvider";

export default function EquipmentInstancesModal({equipmentID, equipmentName, isOpen, setIsOpen} : {equipmentID: number, equipmentName: string, isOpen: boolean, setIsOpen: React.Dispatch<React.SetStateAction<boolean>>}) {
  const isMobile = useIsMobile();

  const equipmentInstancesResult = useQuery(GET_EQUIPMENT_INSTANCES, {variables: {equipmentID}});

  const [createInstance] = useMutation(CREATE_EQUIPMENT_INSTANCE, { refetchQueries: [{ query: GET_EQUIPMENT_INSTANCES, variables: {equipmentID} }] });

  const [name, setName] = useState<string>();

  function handleCreateInstanceClick() {
    createInstance({variables: {equipmentID, name}})
  }

  return (
    <PrettyModal
      open={isOpen}
      onClose={() => setIsOpen(false)}
      width={520}
    >
      <RequestWrapper loading={equipmentInstancesResult.loading} error={equipmentInstancesResult.error}>
        <Box>
          <Typography variant="h5">{equipmentName} Instances</Typography>
          <Stack direction={"column"}>
            {equipmentInstancesResult.data?.equipmentInstances.map((instance: EquipmentInstance) => (
              <EquipmentInstanceRow instance={instance} isMobile={isMobile}/>
            ))}
            {equipmentInstancesResult.data?.equipmentInstances.length === 0 && <Typography m={3} color={"secondary"}>No Instances.</Typography>}
          </Stack>
          <Stack direction={"row"} mt={3}>
            <TextField placeholder="New Instance" value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={handleCreateInstanceClick}>Create Instance</Button>
          </Stack>
        </Box>
      </RequestWrapper>
    </PrettyModal>
  );
}

