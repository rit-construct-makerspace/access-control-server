import { Button, Stack, TextField, Typography } from "@mui/material";
import PrettyModal from "../../common/PrettyModal";
import AddIcon from '@mui/icons-material/Add';
import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useState } from "react";
import { CREATE_CUSTOM_URL } from "../../queries/customUrlQueries";

interface CreateCustomUrlModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateCustomUrlModal(props: CreateCustomUrlModalProps) {

  const [createCustomUrl] = useMutation(CREATE_CUSTOM_URL, { refetchQueries: ["GetUrls"] });

  async function handleCreateCustomUrl() {
    await createCustomUrl({ variables: { shortUrl: createShortUrl, longUrl: createLongUrl } });
    handleCreateCustomUrlModalClose();
  }

  const [createShortUrl, setCreateShortUrl] = useState("");
  const [createLongUrl, setCreateLongUrl] = useState("");

  function handleCreateCustomUrlModalClose() {
    setCreateShortUrl("");
    setCreateLongUrl("")
    props.onClose();
  }


  return (
    <PrettyModal open={props.open} onClose={handleCreateCustomUrlModalClose}>
      <Stack spacing={2}>
        <Typography variant="h5">Create CustomUrl</Typography>
        <TextField
          fullWidth
          required
          label="Custom Url"
          value={createShortUrl}
          onChange={(e) => setCreateShortUrl(e.target.value)}
        />
        <TextField
          fullWidth
          required
          label="Full Link"
          value={createLongUrl}
          onChange={(e) => setCreateLongUrl(e.target.value)}
        />
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Button
            color="error"
            variant="outlined"
            onClick={handleCreateCustomUrlModalClose}
          >
            Cancel
          </Button>
          <Button
            color="success"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={createShortUrl === ""}
            onClick={handleCreateCustomUrl}
          >
            Create
          </Button>
        </Stack>
      </Stack>
    </PrettyModal>
  );
}