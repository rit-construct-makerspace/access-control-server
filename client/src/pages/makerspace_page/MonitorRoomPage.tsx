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
  const [archiveRoom] = useMutation(ARCHIVE_ROOM, {
    // Cache update for archiving room
    update(cache, { data: { archiveRoom } }) {
      cache.modify({
        id: cache.identify({ __typename: "Room", id: archiveRoom.id }),
        fields: {
          archived() {
            return true;
          },
        },
      });
    },
  });
  const [unarchiveRoom] = useMutation(UNARCHIVE_ROOM, {
    // Cache update for unarchiving room
    update(cache, { data: { unarchiveRoom } }) {
      cache.modify({
        id: cache.identify({ __typename: "Room", id: unarchiveRoom.id }),
        fields: {
          archived() {
            return false;
          },
        },
      });
    },
  });
  const [deleteRoom] = useMutation(DELETE_ROOM);

  const [roomName, setRoomName] = useState("");

  async function handleUpdateRoomName() {
    await updateRoomName({
      variables: { id: roomID, name: roomName },
    });
    navigate(`/makerspace/${makerspaceID}/edit`);
  }

  async function handleArchiveRoom() {
    try {
      await archiveRoom({ variables: { id: roomID } });
      toast.success("Room has been archived.");
      queryResult.refetch();
    } catch (error: any) {
      toast.error(`Failed to archive room: ${error.message}`);
    }
  }

  async function handleUnarchiveRoom() {
    try {
      await unarchiveRoom({ variables: { id: roomID } });
      toast.success("Room has been unarchived.");
      queryResult.refetch();
    } catch (error: any) {
      toast.error(`Failed to unarchive room: ${error.message}`);
    }
  }

  async function handleDeleteRoom() {
    const confirm = window.confirm("Are you sure you want to delete? This cannot be undone.");
    if (confirm) {
      try {
        await deleteRoom({ variables: { id: roomID } });
        navigate(`/makerspace/${makerspaceID}/edit`);
      } catch (error: any) {
        toast.error(`Failed to delete room: ${error.message}`);
        // TODO: Delete these console.log lines when done testing/debugging
        console.log("error:", error);
        console.log("message:", error.message);
      }
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
                <Stack direction={isMobile ? "column" : "row"} spacing={2}>
                  {/* Archive / Unarchive button */}
                  {isManagerFor(user, Number(roomID)) && !room.archived ? (
                    <Button variant="contained" startIcon={<ArchiveIcon />} onClick={handleArchiveRoom}>
                      Archive Room
                    </Button>
                  ) : (
                    <Button variant="contained" startIcon={<UnarchiveIcon />} onClick={handleUnarchiveRoom}>
                      Unarchive Room
                    </Button>
                  )}
                  {/* Delete button */}
                  {isManagerFor(user, Number(roomID)) ? (
                    <Button color="error" variant="contained" startIcon={<DeleteIcon />} onClick={handleDeleteRoom}>
                      Delete Room
                    </Button>
                  ) : null}
                </Stack>
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
