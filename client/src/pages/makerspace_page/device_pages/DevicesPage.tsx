import { useQuery } from "@apollo/client/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { GET_MAKERSPACE_WITH_DEVICES } from "../../../queries/makerspaceQueries";
import { Core, Device, Dispenser } from "../../../queries/deviceQueries";
import { Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { CoreCard } from "./CoreCard";
import SearchBar from "../../../common/SearchBar";

export default function DevicesPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const location = useLocation();
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");

  const setUrlParam = (paramName: string, paramValue: string) => {
    const params = new URLSearchParams(location.search);
    if (paramValue === "") {
      params.delete(paramName)
    } else {
      params.set(paramName, paramValue);
    }
    navigate(`/makerspace/${makerspaceID}/devices?` + params, { replace: true });
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryString = searchParams.get("q") ?? "";
    setSearchText(queryString);
  }, [location.search]);

  // Refresh this every 20 seconds
  const makerspaceWithDevicesResult = useQuery(GET_MAKERSPACE_WITH_DEVICES, { variables: { id: makerspaceID }, pollInterval: 20000 });

  const _genericDevices: Device[] = makerspaceWithDevicesResult.data?.makerspaceByID.genericDevices ?? [];
  const cores: Core[] = makerspaceWithDevicesResult.data?.makerspaceByID.cores ?? [];
  const _dispensers: Dispenser[] = makerspaceWithDevicesResult.data?.makerspaceByID.dispensers ?? [];

  const filteredCores: Core[] = cores.filter((core) => core.device.name.toLowerCase().includes(searchText.toLowerCase()))

  return (
    <Stack padding={"10px"} spacing={1}>
      <title>{`${makerspaceWithDevicesResult.data?.makerspaceByID.name ? `${makerspaceWithDevicesResult.data.makerspaceByID.name}'s` : "Loading"} Devices`}</title>
      <Typography variant="h4">{`${makerspaceWithDevicesResult.data?.makerspaceByID.name ? `${makerspaceWithDevicesResult.data.makerspaceByID.name}'s` : "Loading"} Devices`}</Typography>
      <Stack direction={"row"} spacing={2} alignItems={"center"}>
        <SearchBar
          placeholder="Search Devices"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onClear={() => setUrlParam("q", "")}
          onSubmit={() => setUrlParam("q", searchText)}
        />
        <Button variant="contained" color="success" onClick={() => navigate(`/makerspace/${makerspaceID}/devices/new`)}>
          Pair New Device
        </Button>
      </Stack>
      <Typography variant="h5">Cores</Typography>
      <Stack spacing={1}>
        {
          filteredCores.map((core) => (
            <CoreCard core={core} />
          ))
        }
      </Stack>
    </Stack>
  );
}