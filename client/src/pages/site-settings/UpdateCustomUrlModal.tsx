import { Button, Stack, TextField, Typography } from "@mui/material";
import PrettyModal from "../../common/PrettyModal";
import AddIcon from '@mui/icons-material/Add';
import { useMutation } from "@apollo/client";
import { useState } from "react";
import { UPDATE_CUSTOM_URL } from "../../queries/customUrlQueries.js";

interface UpdateCustomUrlModalProps {
  open: boolean;
  onClose: () => void;
  id: number;
  shortUrl: string;
  longUrl: string;
}

export default function UpdateCustomUrlModal(props: UpdateCustomUrlModalProps) {

  const [updateCustomUrl] = useMutation(UPDATE_CUSTOM_URL, { refetchQueries: ["GetUrls"] });

  async function handleUpdateCustomUrl() {
    await updateCustomUrl({ variables: { id: props.id, shortUrl: newShortUrl === null ? props.shortUrl : newShortUrl, longUrl: newLongUrl === null ? props.longUrl : newLongUrl } });
    handleUpdateCustomUrlModalClose();
  }

  const [newShortUrl, setNewShortUrl] = useState(props.shortUrl || null);
  const [newLongUrl, setNewLongUrl] = useState(props.longUrl || null);

  function handleUpdateCustomUrlModalClose() {
    setNewShortUrl(null);
    setNewLongUrl(null)
    props.onClose();
  }

  return (
    <PrettyModal open={props.open} onClose={handleUpdateCustomUrlModalClose}>
      <Stack spacing={2}>
        <Typography variant="h5">Edit CustomUrl</Typography>
        <TextField
          fullWidth
          required
          label="Custom Url"
          value={newShortUrl === null ? props.shortUrl : newShortUrl}
          onChange={(e) => setNewShortUrl(e.target.value)}
        />
        <TextField
          fullWidth
          required
          label="Full Link"
          value={newLongUrl === null ? props.longUrl : newLongUrl}
          onChange={(e) => setNewLongUrl(e.target.value)}
        />
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Button
            color="error"
            variant="outlined"
            onClick={handleUpdateCustomUrlModalClose}
          >
            Cancel
          </Button>
          <Button
            color="success"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleUpdateCustomUrl}
          >
            Confirm
          </Button>
        </Stack>
      </Stack>
    </PrettyModal>
  );
}