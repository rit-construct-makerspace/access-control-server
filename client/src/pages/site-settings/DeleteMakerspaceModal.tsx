import { Button, Card, Stack, TextField, Typography } from "@mui/material";
import PrettyModal from "../../common/PrettyModal";
import { useState } from "react";
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import gql from "graphql-tag";
import { useMutation } from "@apollo/client/react";
import { useIsMobile } from "../../common/IsMobileProvider";

const ARCHIVE_MAKERSPACE = gql`
  mutation ArchiveMakerspace($id: ID!) {
    archiveMakerspace(id: $id) {
      id
    }
  }
`;

interface DeleteMakerspaceModalProps {
  open: boolean;
  onClose: () => void;
  id: number;
  name: string;
}

export default function DeleteMakerspaceModal(props: DeleteMakerspaceModalProps) {
  const isMobile = useIsMobile();

  const [confirmation, setConfirmation] = useState("");

  const [archiveMakerspace] = useMutation(ARCHIVE_MAKERSPACE, { refetchQueries: ["GetMakerspaces"] });

  function handleClose() {
    setConfirmation("");
    props.onClose();
  }

  function handleArchive() {
    archiveMakerspace({
      variables: {
        id: props.id
      }
    });
    handleClose();
  }

  return (
    <PrettyModal open={props.open} onClose={handleClose} width={isMobile ? "100%" : "400px"}>
      <Stack spacing={2}>
        <Typography variant="h6">Delete {props.name}</Typography>
        <Typography><b>This action cannot be undone</b>. To proceed, type the following below:</Typography>
        <Card variant="outlined" sx={{ padding: "10px" }}>
          <Typography fontWeight={"bold"}>
            delete {props.name}
          </Typography>
        </Card>
        <TextField value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Type here to confirm" />
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Button color="info" variant="contained" startIcon={<CloseIcon />} onClick={handleClose}>
            Cancel
          </Button>
          <Button color="error" variant="contained" startIcon={<DeleteIcon />} disabled={confirmation !== "delete " + props.name} onClick={handleArchive}>
            Delete
          </Button>
        </Stack>
      </Stack>
    </PrettyModal>
  );
}