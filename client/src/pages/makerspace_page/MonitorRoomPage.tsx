import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useNavigate, useParams } from "react-router-dom";
import RequestWrapper2 from "../../common/RequestWrapper2";
import styled from "styled-components";
import RoomZoneAssociation from "./RoomZoneAssociation";
import AdminPage from "../AdminPage";
import { DELETE_ROOM, UPDATE_ROOM_NAME } from "../../queries/roomQueries";
import DeleteIcon from '@mui/icons-material/Delete';
import { useCurrentUser } from "../../common/CurrentUserProvider";
import SaveIcon from '@mui/icons-material/Save';
import { isManagerFor } from "../../common/PrivilegeUtils";
import { useIsMobile } from "../../common/IsMobileProvider";

const StyledRecentSwipes = styled.div`
  display: flex;
  flex-flow: row nowrap;
  overflow-x: hidden;
  padding: 1px;
  position: relative;

  // 250px is left nav width. Page has 32px padding (x2). 10px for scrollbars
  max-width: calc(100vw - 250px - 64px - 10px);

  &:after {
    content: "";
    background: linear-gradient(270deg, #fafafa 0%, rgba(250, 250, 250, 0) 50%);
    position: absolute;
    pointer-events: none;

    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
`;

export const GET_ROOM = gql`
  query GetRoom($id: ID!) {
    room(id: $id) {
      name
      zone {
        id
        name
      }
      recentSwipes {
        id
        user {
          id
          firstName
          lastName
        }
      }
      equipment {
        id
        name
        archived
        imageUrl
        sopUrl
        trainingModules {
          id
          name
        }
        numAvailable
        numInUse
        byReservationOnly
      }
    }
  }
`;

export interface Swipe {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const url = "/admin/equipment/";

export default function ManageRoomPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const { roomID } = useParams<{ roomID: string }>();

  const user = useCurrentUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const queryResult = useQuery(GET_ROOM, { variables: { id: roomID } });
  const [updateRoomName] = useMutation(UPDATE_ROOM_NAME);
  const [deleteRoom] = useMutation(DELETE_ROOM);

  const [roomName, setRoomName] = useState("");

  async function handleUpdateRoomName() {
    await updateRoomName({
      variables: {id: roomID, name: roomName}
    })
    navigate(`/makerspace/${makerspaceID}/edit`)
  }

  async function handleDeleteRoom() {
    const confirm = window.confirm("Are you sure you want to delete? This cannot be undone.");
    if (confirm) {
      await deleteRoom({
        variables: {id: roomID}
      })
      navigate(`/makerspace/${makerspaceID}/edit`)
    }
  }

  const [init, setInit] = useState(false);


  function initState(room: any) {
    setRoomName(room.name);
    setInit(true);
  }

  return (
    <RequestWrapper2
      result={queryResult}
      render={({ room }) => {

        if (!init) {
          initState(room);
        }

        return (
        <Box>
          <title>{`Manage ${room.name} | Make @ RIT`}</title>
          <Stack direction="column" spacing={2} margin="25px">
            <Stack direction={isMobile ? "column" : "row"} justifyContent={isMobile ? undefined : "space-between"} alignItems="flex-end" spacing={2}>
              <Typography variant={"h4"}>Manage {room.name} [ID: {roomID}]</Typography>
              {
                isManagerFor(user, Number(roomID))
                ? <Button color="error" variant="contained" startIcon={<DeleteIcon/>} onClick={handleDeleteRoom}>
                  Delete Room
                </Button>
                : null
              }
            </Stack>
            <Stack direction={isMobile ? "column" : "row"} width="auto" spacing={2}>
              <Stack spacing={2} width={isMobile ? "auto" : "50%"} alignItems="flex-end">
                <TextField label="Name" value={roomName} onChange={(e) => (setRoomName(e.target.value))} fullWidth/>
                <Button variant="contained" startIcon={<SaveIcon/>} size="large" onClick={handleUpdateRoomName}>Update Room Name</Button>
              </Stack>
              <Stack spacing={2} width={isMobile ? "auto" : "50%"}>
                <RoomZoneAssociation zoneID={room.zone?.id} roomID={Number(roomID)}></RoomZoneAssociation>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      )}}
    />
  );
}
