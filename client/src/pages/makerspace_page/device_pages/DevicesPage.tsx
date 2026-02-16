import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { GET_MAKERSPACE_WITH_DEVICES } from "../../../queries/makerspaceQueries";
import { Core, Device, Dispenser } from "../../../queries/deviceQueries";
import { Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { CoreCard } from "./CoreCard";

export default function DevicesPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const makerspaceWithDevicesResult = useQuery(GET_MAKERSPACE_WITH_DEVICES, { variables: { id: makerspaceID } });

  const genericDevices: Device[] = makerspaceWithDevicesResult.data?.makerspaceByID.genericDevices ?? [];
  const cores: Core[] = makerspaceWithDevicesResult.data?.makerspaceByID.cores ?? [];
  const dispensers: Dispenser[] = makerspaceWithDevicesResult.data?.makerspaceByID.dispensers ?? [];

  return (
    <Stack>
      <title>{`${makerspaceWithDevicesResult.data?.makerspaceByID.name ? `${makerspaceWithDevicesResult.data.makerspaceByID.name}'s` : "Loading"} Devices`}</title>
      <Typography variant="h4">{`${makerspaceWithDevicesResult.data?.makerspaceByID.name ? `${makerspaceWithDevicesResult.data.makerspaceByID.name}'s` : "Loading"} Devices`}</Typography>
      <Typography variant="h5">Cores</Typography>
      <Stack spacing={1}>
        {
          cores.map((core) => (
            <CoreCard core={core} />
          ))
        }
      </Stack>
    </Stack>
  );
}