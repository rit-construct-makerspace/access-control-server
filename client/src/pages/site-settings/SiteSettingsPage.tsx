import { useQuery } from "@apollo/client";
import { Button, Card, Grid, Stack, Typography } from "@mui/material";
import { GET_ZONES } from "../../queries/zoneQueries";
import RequestWrapper2 from "../../common/RequestWrapper2";
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from "react-router-dom";
import CreateMakerspaceModal from "./CreateMakerspaceModal";
import DeleteMakerspaceModal from "./DeleteMakerspaceModal";

export default function SiteSettingsPage() {
  const navigate = useNavigate();

  const getZonesResult = useQuery(GET_ZONES);

  const [createMakerspaceModal, setCreateMakerspaceModal] = useState(false);
  const [deleteMakerspaceModal, setDeleteMakerspaceModal] = useState(false);
  const [deletionTarget, setDeletionTarget] = useState({ id: 0, name: "THE JIM SHED: HOME OF THE MAKER MINDSET" });

  function handleArchive(id: number, name: string) {
    setDeletionTarget({ id: id, name: name });
    setDeleteMakerspaceModal(true);
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
                            onClick={() => handleArchive(zone.id, zone.name)}
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
        <DeleteMakerspaceModal open={deleteMakerspaceModal} onClose={() => setDeleteMakerspaceModal(false)} id={deletionTarget.id} name={deletionTarget.name} />
        <CreateMakerspaceModal open={createMakerspaceModal} onClose={() => setCreateMakerspaceModal(false)} />
      </Stack>
    </Stack >
  );
}