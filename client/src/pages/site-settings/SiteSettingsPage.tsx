import { useMutation, useQuery } from "@apollo/client";
import { Button, Card, Grid, Stack, TextField, Typography } from "@mui/material";
import gql from "graphql-tag";
import { GET_ZONES } from "../../queries/zoneQueries";
import RequestWrapper2 from "../../common/RequestWrapper2";
import DeleteIcon from '@mui/icons-material/Delete';
import PrettyModal from "../../common/PrettyModal";
import { useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from "react-router-dom";

const CREATE_MAKERSPACE = gql`
  mutation CreateMakerspace($name: String!) {
    addZone(name: $name) {
      id
    }
  }
`;

const ARCHIVE_MAKERSPACE = gql`
  mutation ArchiveMakerspace($id: ID!) {
    archiveZone(id: $id) {
      id
    }
  }
`;

export default function SiteSettingsPage() {
  const navigate = useNavigate();

  const getZonesResult = useQuery(GET_ZONES);

  const [createMakerspace] = useMutation(CREATE_MAKERSPACE, { refetchQueries: ["GetZones"] });
  const [archiveMakerspace] = useMutation(ARCHIVE_MAKERSPACE, { refetchQueries: ["GetZones"] });

  const [createMakerspaceModal, setCreateMakerspaceModal] = useState(false);
  const [createMakerspaceName, setCreateMakerspaceName] = useState("");


  function handleCreateMakerspaceModalClose() {
    setCreateMakerspaceName("");
    setCreateMakerspaceModal(false);
  }

  async function handleCreateMakerspace() {
    await createMakerspace({ variables: { name: createMakerspaceName } });
    handleCreateMakerspaceModalClose();
  }

  return (
    <Stack padding={"15px"} width={"100%"} spacing={4}>
      <Typography variant="h3">Site Settings</Typography>
      <title>Site Settings | Make @ RIT</title>
      <Stack spacing={2}>
        <Stack direction={"row"} spacing={2}>
          <Typography variant="h4">Makerspaces</Typography>
          <Button color="success" variant="contained" onClick={() => setCreateMakerspaceModal(true)} startIcon={<AddIcon />}>
            Create Makerspace
          </Button>
        </Stack>
        <RequestWrapper2 result={getZonesResult} render={(data) => {

          return (
            <Grid container spacing={3}>
              {
                data.zones.map((zone: { id: number, name: string }) => (
                  <Grid>
                    <Card variant="outlined">
                      <Stack width={"300px"} padding={"10px"} spacing={1}>
                        <Typography variant="subtitle1">{zone.name}</Typography>
                        <Stack direction={"row"} justifyContent={"space-between"}>
                          <Button
                            color="error"
                            variant="contained"
                            startIcon={<DeleteIcon />}
                            onClick={() => archiveMakerspace({ variables: { id: zone.id } })}
                          >
                            Delete
                          </Button>
                          <Button color="secondary" variant="outlined" onClick={() => navigate(`/makerspace/${zone.id}/edit`)}>
                            Manage
                          </Button>
                        </Stack>
                      </Stack>
                    </Card>
                  </Grid>
                ))
              }
            </Grid>
          );
        }} />
        <PrettyModal open={createMakerspaceModal} onClose={handleCreateMakerspaceModalClose}>
          <Stack spacing={2}>
            <Typography variant="h5">Create Makerspace</Typography>
            <TextField
              fullWidth
              required
              label="Makerspace Name"
              value={createMakerspaceName}
              onChange={(e) => setCreateMakerspaceName(e.target.value)}
            />
            <Stack direction={"row"} justifyContent={"space-between"}>
              <Button
                color="error"
                variant="outlined"
                onClick={handleCreateMakerspaceModalClose}
              >
                Cancel
              </Button>
              <Button
                color="success"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={createMakerspaceName === ""}
                onClick={handleCreateMakerspace}
              >
                Create
              </Button>
            </Stack>
          </Stack>
        </PrettyModal>
      </Stack>
    </Stack >
  );
}