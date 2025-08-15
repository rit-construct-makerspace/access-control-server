import { useQuery } from "@apollo/client";
import { EquipmentInstance, GET_EQUIPMENT_INSTANCES } from "../../../queries/equipmentInstanceQueries";
import { Grid, Typography } from "@mui/material";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import EquipmentInstanceCard from "./EquipmentInstanceCard";

interface InstanceGridProps {
  equipmentID: number
  isMobile: boolean
}

export default function InstanceGrid(props: InstanceGridProps) {
  const equipmentInstancesResult = useQuery(GET_EQUIPMENT_INSTANCES, { variables: { equipmentID: props.equipmentID } });

  return (
    <RequestWrapper2 result={equipmentInstancesResult} render={(data) => {

      const instances: EquipmentInstance[] = data.equipmentInstances;

      return (
        instances.length === 0
          ? <Typography variant="h6">No Instances!</Typography>
          : <Grid container>
            {
              instances.map((instance: EquipmentInstance) => (
                <Grid margin="10px" key={instance.id}>
                  <EquipmentInstanceCard instance={instance} />
                </Grid>
              ))
            }
          </Grid>
      );
    }} />
  );
}