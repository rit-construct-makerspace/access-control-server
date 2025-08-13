import { useMutation, useQuery } from "@apollo/client";
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { GET_AVAILABLE_FIRMWARE_VERSIONS, GET_READERS_WITH_PAIRINGS, Reader, RESTART_ALL_READERS } from "../../../queries/readersQueries";
import { Box, Button, Checkbox, FormControlLabel, Grid, Link, Stack } from "@mui/material";
import SearchBar from "../../../common/SearchBar";
import { useNavigate, useParams } from "react-router-dom";
import { isValidElement, useEffect, useState } from "react";
import ReaderCard from "./ReaderCard";
import AddIcon from '@mui/icons-material/Add';
import RequestWrapper2 from "../../../common/RequestWrapper2";

export default function ReadersPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const [showAllReaders, setShowAllReaders] = useState<boolean>(false)

  const getReadersResult = useQuery(GET_READERS_WITH_PAIRINGS, { pollInterval: 2000, variables: {makerspaceID: showAllReaders ? null : makerspaceID} });
  const firmwareVersions = useQuery(GET_AVAILABLE_FIRMWARE_VERSIONS);

  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");

  // scroll to designate id
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove the '#' character from the hash
    if (hash) {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const [restartAllReaders] = useMutation(RESTART_ALL_READERS, {variables: {makerspaceID: Number(makerspaceID)}});

  function restartAll(){
    const warning = `This will restart ALL online card readers in makerspace ${makerspaceID}. Are you sure you want to do this?`;
    if (confirm(warning)){
      restartAllReaders();
    }
  }

  return (
    <Box padding="20px">
      <title>Readers | Make @ RIT</title>
      <Stack direction="row" spacing={2} marginBottom={"10px"} alignItems={"center"}>
        <SearchBar
          placeholder="Search access devices"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onClear={() => setSearchText("")}
        />
        <Button color="success" variant="contained" onClick={() => { navigate("/admin/newreader") }}><AddIcon />Pair New Reader</Button>
        <FormControlLabel labelPlacement="start" label = "Show All Readers" control = {<Checkbox onChange={(e)=>setShowAllReaders(e.target.checked)}></Checkbox>} />

        <Link href={import.meta.env.VITE_GRAFANA_READER_STATS_URL}>Reader Stats</Link>

        <Button onClick={restartAll} color = "secondary" variant="contained" startIcon={<RestartAltIcon />}>Restart All</Button>

      </Stack>

      <RequestWrapper2 result={getReadersResult} render={(data) => {
        return <Grid container >
          {data.readers?.map((reader: Reader) => ({
            reader: reader,
            card: <ReaderCard
              reader={reader}
              makerspaceID={makerspaceID ?? "0"}
              firmwareVersions={firmwareVersions}
              searchQuery={searchText} />,
          })).filter((o: { reader: Reader, card: any }) => { return isValidElement(o.card) }).map((o: { reader: Reader, card: any }) => {
            return <Grid key={o.reader.id} alignItems="stretch">
              {o.card}
            </Grid>
          })}
        </Grid>
      }
      } />
    </Box>
  );
}