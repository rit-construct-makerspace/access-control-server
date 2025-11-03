import { Button, Card, Stack, TextField, Typography } from "@mui/material";
import PrettyModal from "../../common/PrettyModal";
import { useState } from "react";
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { useIsMobile } from "../../common/IsMobileProvider";
import { DELETE_CUSTOM_URL } from "../../queries/customUrlQueries.js";

interface DeleteCustomUrlModalProps {
  open: boolean;
  onClose: () => void;
  id: number;
  shortUrl: string;
}

export default function DeleteCustomUrlModal(props: DeleteCustomUrlModalProps) {
  const isMobile = useIsMobile();

  const [deleteCustomUrl] = useMutation(DELETE_CUSTOM_URL, { refetchQueries: ["GetUrls"] });

  function handleClose() {
    props.onClose();
  }

  function handleDelete() {
    deleteCustomUrl({
      variables: {
        id: props.id
      }
    });
    handleClose();
  }

  return (
    <PrettyModal open={props.open} onClose={handleClose} width={isMobile ? "100%" : "400px"}>
      <Stack spacing={2}>
        <Typography variant="h6">Delete /link/{props.shortUrl}</Typography>
        <Typography><b>This action cannot be undone</b>. Are you sure?</Typography>
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Button color="info" variant="contained" startIcon={<CloseIcon />} onClick={handleClose}>
            Cancel
          </Button>
          <Button color="error" variant="contained" startIcon={<DeleteIcon />} onClick={handleDelete}>
            Delete
          </Button>
        </Stack>
        
      </Stack>
    </PrettyModal>
  );
}