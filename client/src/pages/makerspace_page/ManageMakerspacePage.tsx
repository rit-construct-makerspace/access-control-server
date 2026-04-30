import { useMutation, useQuery } from "@apollo/client/react";
import { useParams } from "react-router-dom";
import { FullMakerspace, GET_MAKERSPACE_BY_ID } from "../../queries/makerspaceQueries";
import { Box, Button, Divider, Stack, TextField, Typography } from "@mui/material";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import { CREATE_ROOM } from "../../queries/roomQueries";
import Room from "../../types/Room";
import RoomCard from "./RoomCard";
import PrettyModal from "../../common/PrettyModal";
import { useIsMobile } from "../../common/IsMobileProvider";
import ManageWelcomReadersCard from "./ManageWelcomeReadersCard";
import ManageMakerspaceTrainings from "./ManageMakerspaceTrainings";
import ManageMakerspaceHours from "./ManageMakerspaceHours";
import ManageMakerspaceInformation from "./ManageMakerspaceInformation";
import { useMakeTheme } from "../../common/MakeThemeProvider";


export default function ManageMakerspacePage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const isMobile = useIsMobile();
  const makeTheme = useMakeTheme();

  const getMakerspace = useQuery(GET_MAKERSPACE_BY_ID, { variables: { id: makerspaceID } });

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

        return (
          <Stack spacing={3} padding="0 20px 10px">
            <title>{`Manage ${space.name} | ${makeTheme.title}`}</title>
            <Stack
              direction={isMobile ? "column" : "row"}
              justifyContent={isMobile ? undefined : "space-between"}
              alignItems="center"
              spacing={isMobile ? 2 : undefined}
            >
              <Typography variant="h4" align="center">{`Manage ${space.name} [ID: ${space.id}]`}</Typography>
            </Stack>
            <ManageMakerspaceHours makerspaceID={Number(makerspaceID)} />
            <Stack
              direction={isMobile ? "column" : "row"}
              divider={<Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem />}
              justifyContent={"space-between"}
              width={"100%"}
              spacing={isMobile ? 2 : undefined}
            >
              <Stack spacing={2} divider={<Divider orientation="horizontal" flexItem />} width={isMobile ? "100%" : "48%"}>
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
              <Stack spacing={2} divider={<Divider orientation="horizontal" flexItem />} width={isMobile ? "100%" : "48%"}>
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