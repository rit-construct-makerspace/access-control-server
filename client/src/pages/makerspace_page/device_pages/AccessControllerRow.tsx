import { Card, CardActionArea, Skeleton, Stack, Typography } from "@mui/material";
import { AccessController } from "../../../queries/deviceQueries";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useQuery } from "@apollo/client/react";
import { GET_INSTANCE_BY_CONTROLLER_ID } from "../../../queries/equipmentQueries";
import { EquipmentInstance } from "../../../queries/equipmentInstanceQueries";
import { useNavigate, useParams } from "react-router-dom";

interface AccessControllerRowProps {
  controller: AccessController;
}

export default function AccessControllerRow(props: AccessControllerRowProps) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const navigate = useNavigate();

  const equipmentInstanceResult = useQuery(GET_INSTANCE_BY_CONTROLLER_ID, {
    variables: {
      controllerID: props.controller.id
    },
    fetchPolicy: "cache-first"
  });

  const instance: EquipmentInstance | null = equipmentInstanceResult.data?.getInstanceByControllerID;

  return (
    <Card variant="outlined">
      <CardActionArea
        sx={{ padding: "15px 20px 15px 10px" }}
        onClick={() => { if (!equipmentInstanceResult.loading && instance !== null) { navigate(`/makerspace/${makerspaceID}/equipment/${instance.equipment.id}`) } }}
      >
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
          <Stack height={"100%"}>
            <Typography variant="subtitle1">{`Channel: ${props.controller.channelID}`}</Typography>
            {
              equipmentInstanceResult.loading
                ? <Skeleton />
                : instance === null
                  ? <Typography variant="body1">Not Paired</Typography>
                  : <Typography variant="body1">
                    {`${instance.equipment.name} `}
                    {instance.equipment.subName ? <Typography variant="body1" fontStyle={"italic"} display={"inline"}>[{instance.equipment.subName}]</Typography> : ""}
                  </Typography>
            }
            {
              equipmentInstanceResult.loading
                ? <Skeleton />
                : instance === null
                  ? <Typography variant="body2">This controller is available</Typography>
                  : <Typography variant="body2">{`${instance.name}`}</Typography>
            }
          </Stack>
          {
            !equipmentInstanceResult.loading && instance !== null &&
            <ArrowForwardIosIcon
              color="primary"
              fontSize="large"
            />
          }
        </Stack>
      </CardActionArea>
    </Card>
  );
}