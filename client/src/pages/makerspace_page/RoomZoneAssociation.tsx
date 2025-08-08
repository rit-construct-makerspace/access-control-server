import { useState } from "react";
import {
  Alert,
  Button,
  FormControl,
  MenuItem,
  Select,
} from "@mui/material";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import { gql, useMutation, useQuery } from "@apollo/client";
import { InputLabel } from "@mui/material";
import SaveIcon from '@mui/icons-material/Save';

const SET_ROOM_ZONE = gql`
  mutation setZone($roomID: ID!, $zoneID: ID!) {
    setZone(roomID: $roomID, zoneID: $zoneID) {
      id
    }
  }
`;

const GET_ZONES = gql`
  query getZones {
    zones {
      id
      name
    }
  }
`;

interface RoomZoneAssociationProps {
  roomID: number
  zoneID: number;
}


export default function RoomZoneAssociation({
  roomID,
  zoneID,
}: RoomZoneAssociationProps) {
  const currentUser = useCurrentUser();
  const getZonesResult = useQuery(GET_ZONES);
  const [setNewZone, setNewZoneResult] = useMutation(SET_ROOM_ZONE);

  const [updatedZoneID, setUpdatedZoneID] = useState(zoneID);

  const handleSubmit = () => {
    setNewZone({
      variables: {
        roomID: roomID,
        zoneID: updatedZoneID
      }
    });
  };

  return (
    <>
      <FormControl disabled={!currentUser.admin || setNewZoneResult.loading}>
        <InputLabel id="update-zone-label">Zone</InputLabel>
        <Select
          value={updatedZoneID}
          id="update-zone-label"
          label="Zone"
          onChange={(e) => setUpdatedZoneID(Number(e.target.value))}
        >
          {getZonesResult.data != null && getZonesResult.data.zones.map((zone: { id: number, name: string }) => (
            <MenuItem selected={zone.id === zoneID} value={zone.id}>{zone.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        startIcon={<SaveIcon />}
        loading={setNewZoneResult.loading}
        size="large"
        variant="contained"
        onClick={handleSubmit}
        sx={{ mt: 8, alignSelf: "flex-end" }}
      >
        Update Zone
      </Button>

      {!currentUser.admin && (
        <Alert severity="info" sx={{ width: "max-content", mt: 1 }}>
          You do not have permission to change this.
        </Alert>
      )}
    </>
  );
}