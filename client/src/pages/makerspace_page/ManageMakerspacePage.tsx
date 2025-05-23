import { useMutation, useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { FullZone, GET_ZONE_BY_ID, DELETE_ZONE, UPDATE_ZONE } from "../../queries/zoneQueries";
import { Box, Button, Card, CardContent, Divider, Stack, TextField, Typography } from "@mui/material";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { useEffect, useState } from "react";
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from "@mui/icons-material/Delete";
import AdminPage from "../AdminPage";
import ZoneHourOptions from "../lab_management/monitor/ZoneHourOptions";
import AddIcon from '@mui/icons-material/Add';
import { CREATE_ROOM } from "../../queries/roomQueries";
import Room, { FullRoom } from "../../types/Room";
import RoomCard from "../lab_management/monitor/RoomCard";
import PrettyModal from "../../common/PrettyModal";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import Privilege from "../../types/Privilege";


export default function ManageMakerspacePage() {
    const { makerspaceID } = useParams<{ makerspaceID: string }>();

    const user = useCurrentUser();

    const getZone = useQuery(GET_ZONE_BY_ID, {variables: {id: makerspaceID}});
    const [deleteZone] = useMutation(DELETE_ZONE);
    const [updateZone] = useMutation(UPDATE_ZONE);

    const [createRoom] = useMutation(CREATE_ROOM);
    
    const [zoneName, setZoneName] = useState("");
    const [imgUrl, setImgUrl] = useState("");

    const [newRoomName, setNewRoomName] = useState("");
    const [newRoomModal, setNewRoomModal] = useState(false);

    const [init, setInit] = useState(false);

    const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
    
    function handleWindowSizeChange() {
        setWindowWidth(window.innerWidth);
    }
    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);

    const isMobile = windowWidth <= 1100;

    function initState(zone: FullZone) {
        setZoneName(zone.name);
        setImgUrl(zone.imageUrl);
        setInit(true);
    }

    return (
        <AdminPage>
        <RequestWrapper2 result={getZone} render={(data) => {

                const zone: FullZone = data.zoneByID;

                if (!init) {
                    initState(zone);
                };

                const handleDeleteZone = () => {
                    const confirm = window.confirm("Are you sure you want to delete? This cannot be undone.");
                    if (confirm)
                    deleteZone({
                        variables: { id: zone.id },
                        refetchQueries: [{ query:  GET_ZONE_BY_ID, variables: {id: makerspaceID}}],
                    });
                };

                const handleUpdateZone = async () => {
                    await updateZone({
                        variables: {id: makerspaceID, name: zoneName, imageUrl: imgUrl}
                    });
                    window.location.reload();
                };

                const handleCreateRoom = async () => {
                    await createRoom({
                        variables: { name: newRoomName, zoneID: makerspaceID },
                        //refetchQueries: [{ }],
                    });
                    window.location.reload();
                };

            return (
                <Stack spacing={3} padding="20px">
                    <Stack
                        direction={isMobile ? "column" : "row"}
                        justifyContent={isMobile ? undefined : "space-between"}
                        alignItems="center"
                        spacing={isMobile ? 2 : undefined}
                    >
                        <Typography variant="h4" align="center">{`Edit ${zone.name} Makerspace [ID: ${zone.id}]`}</Typography>
                        {
                            user.privilege === Privilege.STAFF
                            ? <Button color="error" variant="contained" onClick={handleDeleteZone} startIcon={<DeleteIcon/>}>Delete Makerspace</Button>
                            : null
                        }
                    </Stack>
                    <Stack direction={isMobile ? "column" : "row"} justifyContent="center" spacing={2} width="auto">
                        <Stack width={isMobile ? "auto" :"800px"} spacing={2} divider={<Divider orientation="horizontal" flexItem/>}>
                            <Stack spacing={2}>
                                <TextField label="Name" value={zoneName} onChange={(e) => (setZoneName(e.target.value))}/>
                                <TextField label="Image URL" value={imgUrl} onChange={(e) => (setImgUrl(e.target.value))}/>
                                <Button color="primary" variant="contained" startIcon={<SaveIcon/>} onClick={handleUpdateZone}>Update</Button>
                            </Stack>
                            <Stack spacing={2} alignItems="center">
                                <Stack
                                    direction={"row"}
                                    justifyContent="space-between"
                                    alignItems="center"
                                    spacing={isMobile ? 2 : undefined}
                                    width="100%"
                                >
                                    <Typography variant="h5" align="center">Rooms</Typography>
                                    <Button color="success" variant="contained" startIcon={<AddIcon/>} onClick={() => (setNewRoomModal(true))}>New Room</Button>
                                    <PrettyModal open={newRoomModal} onClose={() => {setNewRoomModal(false)}}>
                                        <Stack spacing={2}>
                                            <Typography variant="h5">Creating a new room in {zone.name} Makerspace</Typography>
                                            <TextField label="Name" value={newRoomName} onChange={(e) => (setNewRoomName(e.target.value))}/>
                                            <Stack direction="row" justifyContent="flex-end"  spacing={2}>
                                                <Button color="error" variant="contained" onClick={() => {setNewRoomModal(false); setNewRoomName("");}}>Cancel</Button>
                                                <Button color="success" variant="contained" onClick={handleCreateRoom}>Submit</Button>
                                            </Stack>
                                        </Stack>
                                    </PrettyModal>
                                </Stack>
                                {
                                    zone.rooms.map((room: Room) => (
                                        <RoomCard key={room.id} room={room} />
                                    ))
                                }
                            </Stack>
                        </Stack>
                        <Box width={isMobile ? "350px" : "800px"}>
                            <ZoneHourOptions zoneID={zone.id} />
                        </Box>
                    </Stack>
                </Stack>
            );
        }}/>
        </AdminPage>
    );
}