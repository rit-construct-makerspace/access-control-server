import { useState } from "react";
import {
  Alert,
  Button,
  FormControl,
  MenuItem,
  Select,
} from "@mui/material";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { InputLabel } from "@mui/material";
import SaveIcon from '@mui/icons-material/Save';

const SET_ROOM_MAKERSPACE = gql`
  mutation setMakerspace($roomID: ID!, $makerspaceID: ID!) {
    setMakerspace(roomID: $roomID, makerspaceID: $makerspaceID) {
      id
    }
  }
`;

const GET_MAKERSPACES = gql`
  query getMakerspaces {
    makerspaces {
      id
      name
    }
  }
`;

interface RoomMakerspaceAssociationProps {
  roomID: number
  makerspaceID: number;
}


export default function RoomMakerspaceAssociation({
  roomID,
  makerspaceID,
}: RoomMakerspaceAssociationProps) {
  const currentUser = useCurrentUser();
  const getMakerspacesResult = useQuery(GET_MAKERSPACES);
  const [setNewMakerspace, setNewMakerspaceResult] = useMutation(SET_ROOM_MAKERSPACE);

  const [updatedMakerspaceID, setUpdatedMakerspaceID] = useState(makerspaceID);

  const handleSubmit = () => {
    setNewMakerspace({
      variables: {
        roomID: roomID,
        makerspaceID: updatedMakerspaceID
      }
    });
  };

  return (
    <>
      <FormControl disabled={!currentUser.admin || setNewMakerspaceResult.loading}>
        <InputLabel id="update-space-label">Makerspace</InputLabel>
        <Select
          value={updatedMakerspaceID}
          id="update-space-label"
          label="Makerspace"
          onChange={(e) => setUpdatedMakerspaceID(Number(e.target.value))}
        >
          {getMakerspacesResult.data != null && getMakerspacesResult.data.makerspaces.map((space: { id: number, name: string }) => (
            <MenuItem selected={space.id === makerspaceID} value={space.id}>{space.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        startIcon={<SaveIcon />}
        loading={setNewMakerspaceResult.loading}
        size="large"
        variant="contained"
        onClick={handleSubmit}
        sx={{ mt: 8, alignSelf: "flex-end" }}
      >
        Update Makerspace
      </Button>

      {!currentUser.admin && (
        <Alert severity="info" sx={{ width: "max-content", mt: 1 }}>
          You do not have permission to change this.
        </Alert>
      )}
    </>
  );
}