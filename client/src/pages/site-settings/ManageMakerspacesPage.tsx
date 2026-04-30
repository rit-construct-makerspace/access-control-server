import { Button, Card, Grid, Stack, Typography } from "@mui/material";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { GET_MAKERSPACES } from "../../queries/makerspaceQueries";
import { useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteMakerspaceModal from "./DeleteMakerspaceModal";
import CreateMakerspaceModal from "./CreateMakerspaceModal";

export default function ManageMakerspacesAdminPage() {
  const navigate = useNavigate();

  const getMakerspacesResult = useQuery(GET_MAKERSPACES);

  const [createMakerspaceModal, setCreateMakerspaceModal] = useState(false);
  const [deleteMakerspaceModal, setDeleteMakerspaceModal] = useState(false);
  const [deletionTarget, setDeletionTarget] = useState({ id: 0, name: "THE JIM SHED: HOME OF THE MAKER MINDSET" });

  function handleArchive(id: number, name: string) {
    setDeletionTarget({ id: id, name: name });
    setDeleteMakerspaceModal(true);
  }

  return (
    <Stack spacing={3} padding={"20px"}>
      <title>Manage Makerspaces</title>
      <Stack direction={"row"} spacing={2}>
        <Typography variant="h4">Makerspaces</Typography>
        <Button color="success" variant="contained" onClick={() => setCreateMakerspaceModal(true)} startIcon={<AddIcon />}>
          Create Makerspace
        </Button>
      </Stack>
      <RequestWrapper2 result={getMakerspacesResult} render={(data) => {

        return (
          <Grid container spacing={3}>
            {
              data.makerspaces.map((space: { id: number, name: string }) => (
                <Grid>
                  <Card variant="outlined">
                    <Stack width={"300px"} padding={"10px"} spacing={1}>
                      <Typography variant="subtitle1">{space.name}</Typography>
                      <Stack direction={"row"} justifyContent={"space-between"}>
                        <Button
                          color="error"
                          variant="contained"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleArchive(space.id, space.name)}
                        >
                          Delete
                        </Button>
                        <Button color="secondary" variant="outlined" onClick={() => navigate(`/makerspace/${space.id}/edit`)}>
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
  );
}