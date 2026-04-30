import { Button, Stack, TextField, Typography } from "@mui/material";
import PrettyModal from "../../common/PrettyModal";
import AddIcon from '@mui/icons-material/Add';
import { useMutation } from "@apollo/client/react";
import gql from "graphql-tag";
import { useState } from "react";

const CREATE_MAKERSPACE = gql`
  mutation CreateMakerspace($name: String!) {
    addMakerspace(name: $name) {
      id
    }
  }
`;

interface CreateMakerspaceModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateMakerspaceModal(props: CreateMakerspaceModalProps) {

  const [createMakerspace] = useMutation(CREATE_MAKERSPACE, { refetchQueries: ["GetMakerspaces"] });

  async function handleCreateMakerspace() {
    await createMakerspace({ variables: { name: createMakerspaceName } });
    handleCreateMakerspaceModalClose();
  }

  const [createMakerspaceName, setCreateMakerspaceName] = useState("");

  function handleCreateMakerspaceModalClose() {
    setCreateMakerspaceName("");
    props.onClose();
  }


  return (
    <PrettyModal open={props.open} onClose={handleCreateMakerspaceModalClose}>
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
  );
}