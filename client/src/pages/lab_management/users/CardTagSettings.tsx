import { useState } from "react";
import {
  Alert,
  FormControl,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { gql, useMutation } from "@apollo/client";
import GET_USERS from "../../../queries/getUsers";
import { GET_USER } from "./UserModal";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LoadingButton from "@mui/lab/LoadingButton";
import { toast } from "react-toastify";
import { isStaff } from "../../../common/PrivilegeUtils";


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
    if (!updatedCardTagID || updatedCardTagID == "") {
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
    <>
      <Typography variant="h6" component="div" mt={6}>
        Card Tag Settings
      </Typography>
      {!hasCardTag && (
        <Alert severity="error">No Associated Card Tag</Alert>
      )}

      <FormControl disabled={!isStaff(currentUser) || setCardTagIDResult.loading}>
        <TextField
          label="Update RIT ID"
          value={updatedCardTagID}
          onChange={(e) => {
            setUpdatedCardTagID(e.target.value.replaceAll(/(?=[^a-z])([^0-9])/g, ''))
          }}
          sx={{ mt: 2 }}
        />
        <LoadingButton
          loading={setCardTagIDResult.loading}
          size="large"
          variant="contained"
          onClick={handleSubmit}
          sx={{ mt: 1, alignSelf: "flex-end" }}
        >
          Update RIT Card Tag
        </LoadingButton>
      </FormControl>
      {!isStaff(currentUser) && (
        <Alert severity="info" sx={{ width: "max-content", mt: 1 }}>
          You do not have permission to change this.
        </Alert>
      )}
    </>
  );
}