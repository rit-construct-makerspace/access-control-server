import { useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery } from "@apollo/client/react";
import { useNavigate, useParams } from "react-router-dom";
import RequestWrapper2 from "../../common/RequestWrapper2";
import RoomMakerspaceAssociation from "./RoomMakerspaceAssociation";
import { ARCHIVE_ROOM, DELETE_ROOM, GET_ROOM, UNARCHIVE_ROOM, UPDATE_ROOM_NAME } from "../../queries/roomQueries";
import ArchiveIcon from "@mui/icons-material/Archive";
import PublishIcon from "@mui/icons-material/Publish";
import DeleteIcon from "@mui/icons-material/Delete";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import SaveIcon from "@mui/icons-material/Save";
import { isManagerFor } from "../../common/PrivilegeUtils";
import { useIsMobile } from "../../common/IsMobileProvider";
import { TrainingModule } from "../../common/TrainingModuleUtils";
import ManageRoomTrainings from "./ManageRoomTrainings";
import { toast } from "react-toastify";
import EquipmentBlockDialog from "./EquipmentBlockDialog";
import { useMakeTheme } from "../../common/MakeThemeProvider";

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
  const makeTheme = useMakeTheme();

  const queryResult = useQuery(GET_ROOM, { variables: { id: roomID } });
  const [updateRoomName] = useMutation(UPDATE_ROOM_NAME);
  const [archiveRoom] = useMutation(ARCHIVE_ROOM);
  const [unarchiveRoom] = useMutation(UNARCHIVE_ROOM);
  const [deleteRoom] = useMutation(DELETE_ROOM);

  const [roomName, setRoomName] = useState("");
  const [equipmentBlockingDelete, setEquipmentBlockingDelete] = useState<{ id: number; name: string }[]>([]);
  const [showEquipmentError, setShowEquipmentError] = useState(false);

  async function handleUpdateRoomName() {
    await updateRoomName({
      variables: { id: roomID, name: roomName },
    });
    queryResult.refetch();
    navigate(`/makerspace/${makerspaceID}/edit`);
  }

  async function handleArchiveRoom() {
    try {
      await archiveRoom({
        variables: { id: Number(roomID) },
      });
      toast.success("Room archived");
      queryResult.refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleUnarchiveRoom() {
    try {
      await unarchiveRoom({
        variables: { id: Number(roomID) },
      });
      toast.success("Room unarchived");
      queryResult.refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDeleteRoom() {
    const confirm = window.confirm("Are you sure you want to delete? This cannot be undone.");
    if (!confirm) return;

    const room = queryResult.data?.room;
    if (room.equipment && room.equipment.length > 0) {
      setEquipmentBlockingDelete(room.equipment);
      setShowEquipmentError(true);
      return
    }

    try {
      await deleteRoom({
        variables: { id: roomID },
      });
      navigate(`/makerspace/${makerspaceID}/edit`);
    } catch (error: any) {
      toast.error(error.message);
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
            <title>{`Manage ${room.name} | ${makeTheme.title}`}</title>
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
                  {room.archived ? (
                    <Button
                      color="success"
                      variant="contained"
                      startIcon={<PublishIcon />}
                      onClick={handleUnarchiveRoom}
                    >
                      Publish Room
                    </Button>
                  ) : (
                    <Button color="primary" variant="contained" startIcon={<ArchiveIcon />} onClick={handleArchiveRoom}>
                      Archive Room
                    </Button>
                  )}
                  <Button color="error" variant="contained" startIcon={<DeleteIcon />} onClick={handleDeleteRoom} disabled={isManagerFor(user, Number(roomID)) ? false : true}>
                    Delete Room
                  </Button>
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
                  />
                </Stack>
              </Stack>
            </Stack>

            <EquipmentBlockDialog
              open={showEquipmentError}
              onClose={() => setShowEquipmentError(false)}
              equipmentList={equipmentBlockingDelete}
              makerspaceID={Number(makerspaceID)}
            />
          </Box>
        );
      }}
    />
  );
}
