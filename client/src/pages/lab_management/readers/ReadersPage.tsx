import { useQuery } from "@apollo/client";
import { GET_AVAILABLE_FIRMWARE_VERSIONS, GET_READERS, Reader } from "../../../queries/readersQueries";
import { Box, Button, Grid, Link, Stack } from "@mui/material";
import SearchBar from "../../../common/SearchBar";
import { useNavigate, useParams } from "react-router-dom";
import { isValidElement, useEffect, useState } from "react";
import ReaderCard from "./ReaderCard";
import AddIcon from '@mui/icons-material/Add';
import RequestWrapper2 from "../../../common/RequestWrapper2";

export default function ReadersPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const getReadersResult = useQuery(GET_READERS, { pollInterval: 2000 });
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

  return (
    <Box padding="20px">
      <title>Readers | Make @ RIT</title>
      <Stack direction="row" spacing={2} marginBottom={"10px"}>
        <SearchBar
          placeholder="Search access devices"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onClear={() => setSearchText("")}
        />
        <Button color="success" variant="contained" onClick={() => { navigate("/admin/newreader") }}><AddIcon />Pair New Reader</Button>
        <Link href={import.meta.env.VITE_GRAFANA_READER_STATS_URL}>Reader Stats</Link>
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