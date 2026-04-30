import { useState } from "react";
import {
  Alert,
  Button,
  FormControl,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import GET_USERS, { GET_USER } from "../../../queries/userQueries";
import { toast } from "react-toastify";
import { isStaff } from "../../../common/PrivilegeUtils";
import AddCardIcon from '@mui/icons-material/AddCard';


const SET_CARD_TAG_ID = gql`
  mutation SetCardTagID($userID: ID!, $cardTagID: String!) {
    setCardTagID(userID: $userID, cardTagID: $cardTagID) {
      id
    }
  }
`;

interface CardTagSettingsProps {
  userID: string;
  hasCardTag: boolean;
}


export default function CardTagSettings({
  userID,
  hasCardTag,
}: CardTagSettingsProps) {
  const currentUser = useCurrentUser();
  const [setCardTagID, setCardTagIDResult] = useMutation(SET_CARD_TAG_ID);

  const [updatedCardTagID, setUpdatedCardTagID] = useState("");

  const handleSubmit = () => {
    if (!updatedCardTagID || updatedCardTagID === "") {
      window.alert(
        "New RIT ID cannot be empty."
      );
      return;
    }

    setCardTagID({
      variables: {
        userID: userID,
        cardTagID: updatedCardTagID
      },
      refetchQueries: [
        { query: GET_USERS },
        { query: GET_USER, variables: { id: userID } },
      ],
    }).then(() => {
      cardTagSuccessAnimation();
      setUpdatedCardTagID("");
    });
  };

  const cardTagSuccessAnimation = () => {
    toast.success('Card Tag Updated Successfully', {
      position: "bottom-left",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  }

  return (
    <Stack mt={2} spacing={1}>
      <Typography variant="h6">Card Tag</Typography>
      {!hasCardTag && (
        <Alert severity="warning">No Associated Card Tag</Alert>
      )}
      <FormControl disabled={!isStaff(currentUser) || setCardTagIDResult.loading}>
        <Stack direction={"row"} spacing={2} alignItems="center">
          <TextField
            label="Update Card Tag ID"
            value={updatedCardTagID}
            onChange={(e) => {
              setUpdatedCardTagID(e.target.value.replaceAll(/(?=[^a-z])([^0-9])/g, ''))
            }}
            fullWidth
          />
          <Button
            loading={setCardTagIDResult.loading}
            size="large"
            variant="contained"
            onClick={handleSubmit}
            startIcon={<AddCardIcon />}
            sx={{ whiteSpace: "nowrap", minWidth: "unset" }}
            disabled={!isStaff(currentUser)}
          >
            Update Card Tag
          </Button>
        </Stack>
      </FormControl>
      {!isStaff(currentUser) && (
        <Alert severity="info" sx={{ width: "max-content" }}>
          You do not have permission to change this.
        </Alert>
      )}
    </Stack>
  );
}