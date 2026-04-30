import { useQuery } from "@apollo/client/react";
import { EquipmentInstance, GET_EQUIPMENT_INSTANCES } from "../../../queries/equipmentInstanceQueries";
import { Alert, Grid, Stack } from "@mui/material";
import EquipmentInstanceRow from "./EquipmentInstanceRow";
import EquipmentInstanceCard from "./EquipmentInstanceCard";

interface InstanceGridProps {
  equipmentID: number
  isMobile: boolean
}

export default function InstanceGrid(props: InstanceGridProps) {
  const equipmentInstancesResult = useQuery(GET_EQUIPMENT_INSTANCES, { variables: { equipmentID: props.equipmentID } });
  const instances: EquipmentInstance[] = equipmentInstancesResult.data?.equipmentInstances ?? [];

  return (
    instances.length === 0
      ? <Alert severity="info" variant="filled" sx={{ width: "max-content" }}>No Instances!</Alert>
      : props.isMobile || instances.length > 7
        ? <Grid container spacing={2}>
          {
            instances.map((instance: EquipmentInstance) => (
              <Grid key={instance.id} width={props.isMobile ? "100%" : "280px"}>
                <EquipmentInstanceCard instance={instance} />
              </Grid>
            ))
          }
        </Grid>
        : <Stack spacing={2}>
          {
            instances.map((instance: EquipmentInstance) => (
              <EquipmentInstanceRow instance={instance} />
            ))
          }
        </Stack>
  );
}