import { Button, Stack, TextField, Typography } from "@mui/material"
import { isManager } from "../../../../common/PrivilegeUtils"
import { useCurrentUser } from "../../../../common/CurrentUserProvider"
import { ChangeEvent, useState } from "react";
import { gql, useMutation } from "@apollo/client";


const SET_NOTES = gql`
  mutation SetNotes($userID: ID!, $notes: String!) {
    setNotes(userID: $userID, notes: $notes) {
      id
    }
  }
`;

interface NotesProps {
  user: any
}

export default function Notes(props: NotesProps) {
  const currentUser = useCurrentUser();

  const [notes, setNotes] = useState<string>();
    
  const [setNotesMutation, setNotesResult] = useMutation(SET_NOTES);
  

  
  const handleNotesChanged = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNotes(event.target.value)
  };
  
  return (
    <Stack>
      {
        isManager(currentUser) &&
        <Stack spacing={1} mt={2}>
          <Typography variant="h6" component="div">
            Notes
          </Typography>
          <TextField
            aria-label="Notes"
            defaultValue={props.user.notes ?? ""}
            placeholder="Notes"
            value={notes}
            onChange={handleNotesChanged}
            onSubmit={() => setNotesMutation({ variables: { userID: props.user.id, notes: notes } })}
            multiline
            minRows={2}
          />
          <Button
            variant="contained"
            loading={setNotesResult.loading}
            onClick={() => setNotesMutation({ variables: { userID: props.user.id, notes: notes } })}
            sx={{ alignSelf: "flex-end" }}
          >
            Update Notes
          </Button>
        </Stack>
      }
    </Stack>
  )
}