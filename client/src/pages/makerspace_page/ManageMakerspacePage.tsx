import { useMutation, useQuery } from "@apollo/client";
import { useNavigate, useParams } from "react-router-dom";
import { ARCHIVE_MAKERSPACE, DELETE_MAKERSPACE, FullMakerspace, GET_MAKERSPACE_BY_ID, UNARCHIVE_MAKERSPACE } from "../../queries/makerspaceQueries";
import { Box, Button, Divider, Stack, TextField, Typography } from "@mui/material";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ArchiveIcon from "@mui/icons-material/Archive";
import PublishIcon from "@mui/icons-material/Publish";
import DeleteIcon from "@mui/icons-material/Delete";
import { CREATE_ROOM } from "../../queries/roomQueries";
import Room from "../../types/Room";
import RoomCard from "./RoomCard";
import PrettyModal from "../../common/PrettyModal";
import { useIsMobile } from "../../common/IsMobileProvider";
import ManageWelcomReadersCard from "./ManageWelcomeReadersCard";
import ManageMakerspaceTrainings from "./ManageMakerspaceTrainings";
import ManageMakerspaceHours from "./ManageMakerspaceHours";
import ManageMakerspaceInformation from "./ManageMakerspaceInformation";
import { toast } from "react-toastify";


export default function ManageMakerspacePage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const getMakerspace = useQuery(GET_MAKERSPACE_BY_ID, { variables: { id: makerspaceID } });

  const [archiveMakerspace] = useMutation(ARCHIVE_MAKERSPACE);
  const [unarchiveMakerspace] = useMutation(UNARCHIVE_MAKERSPACE);
  const [deleteMakerspace] = useMutation(DELETE_MAKERSPACE);

  const [createRoom] = useMutation(CREATE_ROOM);

  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomModal, setNewRoomModal] = useState(false);

  return (
    <Box>
      <RequestWrapper2 result={getMakerspace} render={(data) => {
          const space: FullMakerspace = data.makerspaceByID;

          const handleCreateRoom = async () => {
            await createRoom({
              variables: { name: newRoomName, makerspaceID: makerspaceID },
              //refetchQueries: [{ }],
            });
            window.location.reload();
          };

          const handleArchiveMakerspace = async () => {
            try {
              await archiveMakerspace({ variables: { id: makerspaceID } });
              toast.success("Room archived");
              getMakerspace.refetch();
            } catch (error: any) {
              toast.error(error.message);
            }
          }

          const handleUnarchiveMakerspace = async () => {
            try {
              await unarchiveMakerspace({ variables: { id: makerspaceID } });
              toast.success("Room unarchived");
              getMakerspace.refetch();
            } catch (error: any) {
              toast.error(error.message);
            }
          }

          const handleDeleteMakerspace = async () => {
            if (window.confirm("Are you sure you want to delete this makerspace? This cannot be undone.")) {
              await deleteMakerspace({ variables: { id: makerspaceID } });

              navigate(`/`);
            }
          };

          return (
            <Stack spacing={3} padding="0 20px 10px">
              <title>{`Manage ${space.name} | Make @ RIT`}</title>
              <Stack
                direction={isMobile ? "column" : "row"}
                justifyContent={isMobile ? undefined : "space-between"}
                alignItems="center"
                spacing={isMobile ? 2 : undefined}
              >
                <Typography variant="h4" align="center">{`Manage ${space.name} [ID: ${space.id}]`}</Typography>
                <Stack
                  direction={"row"}
                  justifyContent={isMobile ? undefined : "space-between"}
                  spacing={2}
                >
                  {space.archived 
                  ? <Button variant="contained" color="success" startIcon={<PublishIcon />} onClick={handleUnarchiveMakerspace}>Publish</Button> 
                  : <Button variant="contained" color="primary" startIcon={<ArchiveIcon />} onClick={handleArchiveMakerspace}>Archive</Button>
                  }                  
                  <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteMakerspace}>
                    Delete
                  </Button>
                </Stack>
              </Stack>
              <ManageMakerspaceHours makerspaceID={Number(makerspaceID)} />
            <Stack direction={"row"} divider={<Divider orientation="vertical" flexItem />} justifyContent={"space-between"} width={"100%"}>
                <Stack spacing={2} divider={<Divider orientation="horizontal" flexItem />} width={"48%"}>
                  <ManageMakerspaceInformation
                    id={Number(makerspaceID)}
                    name={space.name}
                    subtitle={space.subtitle}
                    location={space.location}
                    hours={space.hours}
                    imageUrl={space.imageUrl}
                    docsLink={space.docsLink}
                    description={space.description}
                  />
                  <Stack spacing={2} alignItems="center">
                    <Stack
                      direction={"row"}
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={isMobile ? 2 : undefined}
                      width="100%"
                    >
                    <Typography variant="h5" align="center" fontWeight={"bold"}>Rooms</Typography>
                    <Button color="success" variant="contained" startIcon={<AddIcon />} onClick={() => (setNewRoomModal(true))}>New Room</Button>
                    <PrettyModal open={newRoomModal} onClose={() => { setNewRoomModal(false) }}>
                        <Stack spacing={2}>
                          <Typography variant="h5">Creating a new room in {space.name} Makerspace</Typography>
                        <TextField label="Name" value={newRoomName} onChange={(e) => (setNewRoomName(e.target.value))} />
                          <Stack direction="row" justifyContent="flex-end" spacing={2}>
                          <Button color="error" variant="contained" onClick={() => { setNewRoomModal(false); setNewRoomName(""); }}>Cancel</Button>
                          <Button color="success" variant="contained" onClick={handleCreateRoom}>Submit</Button>
                          </Stack>
                        </Stack>
                      </PrettyModal>
                    </Stack>
                  {
                    space.rooms.map((room: Room) => (
                      <RoomCard key={room.id} makerspaceID={space.id} room={room} />
                    ))
                  }
                  </Stack>
                </Stack>
                <Stack spacing={2} divider={<Divider orientation="horizontal" flexItem />} width={"48%"}>
                  <ManageWelcomReadersCard makerspaceId={Number(makerspaceID)} />
                  <ManageMakerspaceTrainings makerspaceID={Number(makerspaceID)} trainings={space.trainingModules} />
                </Stack>
              </Stack>
            </Stack>
          );
      }} />
    </Box >
  );
}