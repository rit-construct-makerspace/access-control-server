import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { GET_MAKERSPACE_WITH_DEVICES } from "../../../queries/makerspaceQueries";
import { Core, Device, Dispenser } from "../../../queries/deviceQueries";
import { Stack, Typography } from "@mui/material";

export default function DevicesPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const makerspaceWithDevicesResult = useQuery(GET_MAKERSPACE_WITH_DEVICES, { variables: { id: makerspaceID } });

  const genericDevices: Device[] = makerspaceWithDevicesResult.data?.genericDevices ?? [];
  const cores: Core[] = makerspaceWithDevicesResult.data?.cores ?? [];
  const dispensers: Dispenser[] = makerspaceWithDevicesResult.data?.dispensers ?? [];

  return (
    <Stack>
      <Typography variant="h4">{`${makerspaceWithDevicesResult.data?.name ? `${makerspaceWithDevicesResult.data.name}'s` : "Loading"} Devices`}</Typography>
      <Typography variant="h5">Cores</Typography>
      <Stack>
        {
          cores.map((core) => (
            <Typography>{core.device.name}</Typography>
          ))
        }
      </Stack>
    </Stack>
  );
}