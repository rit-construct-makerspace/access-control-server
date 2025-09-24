import { gql, useMutation, useQuery } from "@apollo/client";
import ArchiveIcon from "@mui/icons-material/Archive";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import { useIsMobile } from "../../common/IsMobileProvider";
import { isManagerFor } from "../../common/PrivilegeUtils";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { TrainingModule } from "../../common/TrainingModuleUtils";
import { ARCHIVE_ROOM, DELETE_ROOM, UNARCHIVE_ROOM, UPDATE_ROOM_NAME } from "../../queries/roomQueries";
import ManageRoomTrainings from "./ManageRoomTrainings";
import RoomMakerspaceAssociation from "./RoomMakerspaceAssociation";
import { toast } from "react-toastify";

export const GET_ROOM = gql`
  query GetRoom($id: ID!) {
    room(id: $id) {
      name
      archived
      makerspace {
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
      trainingModules {
        id
        name
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

export default function ManageRoomPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const { roomID } = useParams<{ roomID: string }>();

  const user = useCurrentUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const queryResult = useQuery(GET_ROOM, { variables: { id: roomID } });
  const [updateRoomName] = useMutation(UPDATE_ROOM_NAME);
  const [archiveRoom] = useMutation(ARCHIVE_ROOM);
  const [unarchiveRoom] = useMutation(UNARCHIVE_ROOM);
  const [deleteRoom] = useMutation(DELETE_ROOM);

  const [roomName, setRoomName] = useState("");

  async function handleUpdateRoomName() {
    await updateRoomName({
      variables: { id: roomID, name: roomName },
    });
    navigate(`/makerspace/${makerspaceID}/edit`);
  }

  async function handleArchiveRoom() {
    toast.info("Archiving Room...");
    await archiveRoom({
      variables: { id: roomID },
      refetchQueries: [{ query: GET_ROOM, variables: { id: roomID } }],
    });
    toast.success("Room has been archived.");
  }

  async function handleUnarchiveRoom() {
    toast.info("Unarchiving Room...");
    await unarchiveRoom({
      variables: { id: roomID },
      refetchQueries: [{ query: GET_ROOM, variables: { id: roomID } }],
    });
    toast.success("Room has been unarchived.");
  }

  async function handleDeleteRoom() {
    const confirm = window.confirm("Are you sure you want to delete? This cannot be undone.");
    if (confirm) {
      await deleteRoom({
        variables: { id: roomID },
      });
      navigate(`/makerspace/${makerspaceID}/edit`);
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

        const roomTrainings: TrainingModule[] = room.trainingModules;

        return (
          <Box margin={"20px"}>
            <title>{`Manage ${room.name} | Make @ RIT`}</title>
            <Stack direction="column" spacing={2}>
              <Stack
                direction={isMobile ? "column" : "row"}
                justifyContent={isMobile ? undefined : "space-between"}
                alignItems="flex-end"
                spacing={2}
              >
                <Typography variant={"h4"}>
                  Manage {room.name} [ID: {roomID}]
                </Typography>
                {isManagerFor(user, Number(roomID)) && !room.archived ? (
                  <Button variant="contained" startIcon={<ArchiveIcon />} onClick={handleArchiveRoom}>
                    Archive Room
                  </Button>
                ) : isManagerFor(user, Number(roomID)) && room.archived ? (
                  <Button variant="contained" startIcon={<UnarchiveIcon />} onClick={handleUnarchiveRoom}>
                    Unarchive Room
                  </Button>
                ) : null}
                {isManagerFor(user, Number(roomID)) ? (
                  <Button color="error" variant="contained" startIcon={<DeleteIcon />} onClick={handleDeleteRoom}>
                    Delete Room
                  </Button>
                ) : null}
              </Stack>
              <Stack direction={isMobile ? "column" : "row"} width="auto" spacing={2}>
                <Stack spacing={2} width={isMobile ? "auto" : "50%"} alignItems="flex-end">
                  <TextField label="Name" value={roomName} onChange={(e) => setRoomName(e.target.value)} fullWidth />
                  <Button variant="contained" startIcon={<SaveIcon />} size="large" onClick={handleUpdateRoomName}>
                    Update Room Name
                  </Button>
                  <ManageRoomTrainings roomID={Number(roomID)} trainings={roomTrainings} />
                </Stack>
                <Stack spacing={2} width={isMobile ? "auto" : "50%"}>
                  <RoomMakerspaceAssociation
                    makerspaceID={room.makerspace?.id}
                    roomID={Number(roomID)}
                  ></RoomMakerspaceAssociation>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        );
      }}
    />
  );
}
