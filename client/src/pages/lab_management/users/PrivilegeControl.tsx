import { Alert, Button, Card, Checkbox, FormControl, FormControlLabel, FormGroup, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { ChangeEvent, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { MAKE_USER_MANAGER, MAKE_USER_STAFF, MAKE_USER_TRAINER, REVOKE_USER_MANAGER, REVOKE_USER_STAFF, REVOKE_USER_TRAINER, SET_USER_ADMIN } from "../../../queries/permissionQueries";
import { FullZone, GET_FULL_ZONES } from "../../../queries/zoneQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { isManagerFor } from "../../../common/PrivilegeUtils";
import DeleteIcon from '@mui/icons-material/Delete';
import { GET_USER } from "./UserModal";
import TrainerCard from "./TrainerCard";
import TrainerEquipmentSelect from "./TrainerEquipmentSelect";
import PersonAddIcon from '@mui/icons-material/PersonAdd';


interface PrivilegeControlProps {
    user: any;
    isMobile: boolean;
}

export default function PrivilegeControl(props: PrivilegeControlProps) {
    const currentUser = useCurrentUser();

    const [adminState, setAdminState] = useState(props.user.admin);
    const [setAdmin] = useMutation(SET_USER_ADMIN, { refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });

    function handleAdminChange(e: ChangeEvent<{}>, checked: boolean) {
        setAdminState(checked);
        setAdmin({ variables: { userID: props.user.id, admin: checked } })
    }

    const getZonesResult = useQuery(GET_FULL_ZONES);

    const [makeUserManager] = useMutation(MAKE_USER_MANAGER, { refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });
    const [revokeUserManager] = useMutation(REVOKE_USER_MANAGER, { refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });
    const [addManagerPerms, setAddManagerPerms] = useState(-1);

    async function handleAddManagerPerms() {
        if (addManagerPerms === -1) {
            alert("Makerspace cannot be empty, please select a makerspace");
            return;
        }
        await makeUserManager({
            variables: { userID: props.user.id, makerspaceID: addManagerPerms },
        });
    }

    async function removeManagerPerms(makerspaceID: number) {
        await revokeUserManager({ variables: { userID: props.user.id, makerspaceID: makerspaceID } });
    }

    const [makeUserStaff] = useMutation(MAKE_USER_STAFF, { refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });
    const [revokeUserStaff] = useMutation(REVOKE_USER_STAFF, { refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });
    const [addStaffPerms, setAddStaffPerms] = useState(-1);

    async function handleAddStaffPerms() {
        if (addStaffPerms === -1) {
            alert("Makerspace cannot be empty, please select a makerspace");
            return;
        }
        await makeUserStaff({
            variables: { userID: props.user.id, makerspaceID: addStaffPerms }
        });
    }

    async function removeStaffPerms(makerspaceID: number) {
        await revokeUserStaff({ variables: { userID: props.user.id, makerspaceID: makerspaceID } });
    }

    const [makeUserTrainer] = useMutation(MAKE_USER_TRAINER, { refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });
    const [revokeUserTrainer] = useMutation(REVOKE_USER_TRAINER, { refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });
    const [addTrainerPerms, setAddTrainerPerms] = useState(-1);

    async function handleAddTrainerPerms() {
        if (addTrainerPerms === -1) {
            alert("Equipment cannot be empty, please select a piece of equipment");
            return;
        }
        await makeUserTrainer({
            variables: { userID: props.user.id, equipmentID: addTrainerPerms }
        });
    }

    async function removeTrainerPerms(equipmentID: number) {
        await revokeUserTrainer({ variables: { userID: props.user.id, equipmentID: equipmentID } });
    }

    return (
        <Stack>
            <Typography variant="h6" component="div" mt={2}>
                Permissions
            </Typography>
            <FormGroup sx={{ alignSelf: "flex-start" }}>
                <FormControlLabel
                    labelPlacement="start"
                    label={<Typography variant="subtitle1" fontWeight="bold">Admin</Typography>}
                    checked={adminState}
                    control={<Checkbox sx={{ padding: "0 9px" }} color="success" />}
                    disabled={!currentUser.admin || props.user.id === currentUser.id}
                    onChange={handleAdminChange}
                    sx={{ margin: "0" }}
                />
            </FormGroup>
            <RequestWrapper2 result={getZonesResult} render={(data) => {

                const fullZones: FullZone[] = data.zones;

                const managerZones = fullZones.filter((zone: FullZone) => props.user.manager.includes(Number(zone.id)));
                const potentialManagerZones = fullZones.filter((zone: FullZone) => !props.user.manager.includes(Number(zone.id)) && isManagerFor(currentUser, zone.id));
                const staffZones = fullZones.filter((zone: FullZone) => props.user.staff.includes(Number(zone.id)));
                const potentialStaffZones = fullZones.filter((zone: FullZone) => !props.user.staff.includes(Number(zone.id)) && isManagerFor(currentUser, zone.id));

                return (
                    <Stack spacing={2}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle1" fontWeight="bold">Manager</Typography>
                            <Stack direction="row" spacing={1}>
                                {
                                    managerZones.length === 0
                                        ? <Alert severity="info">Not a Manager!</Alert>
                                        : managerZones.map((zone: FullZone) => {
                                            return (
                                                <Card sx={{ maxWidth: "200px", padding: "10px" }}>
                                                    <Stack direction={props.isMobile ? "column" : "row"} justifyContent="space-between">
                                                        <Typography variant="body2">{zone.name} ID: {zone.id}</Typography>
                                                        {
                                                            isManagerFor(currentUser, zone.id) && !(currentUser.id === props.user.id)
                                                                ? <IconButton color="error" onClick={() => { removeManagerPerms(zone.id) }}>
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                                : null
                                                        }
                                                    </Stack>
                                                </Card>
                                            );
                                        })
                                }
                            </Stack>
                            <Stack direction="row" spacing={1}>
                                <FormControl fullWidth>
                                    <InputLabel id="add-manager-permissions">Makerspace</InputLabel>
                                    <Select
                                        id="add-manager-permissions"
                                        label="Makerspace"
                                        onChange={(e) => setAddManagerPerms(Number(e.target.value))}
                                        fullWidth
                                    >
                                        {
                                            potentialManagerZones.map((zone: FullZone) => {
                                                return <MenuItem value={zone.id}>{zone.name} ID: {zone.id}</MenuItem>
                                            })
                                        }
                                    </Select>
                                </FormControl>
                                <Button variant="contained" color="success" onClick={handleAddManagerPerms} startIcon={<PersonAddIcon />}>
                                    Add
                                </Button>
                            </Stack>
                        </Stack>
                        <Stack spacing={1}>
                            <Typography variant="subtitle1" fontWeight="bold">Staff</Typography>
                            <Stack direction="row" spacing={1}>
                                {
                                    staffZones.length === 0
                                        ? <Alert severity="info">Not Staff!</Alert>
                                        : staffZones.map((zone: FullZone) => {
                                            return (
                                                <Card sx={{ maxWidth: "200px", padding: "10px" }}>
                                                    <Stack direction={props.isMobile ? "column" : "row"} justifyContent="space-between">
                                                        <Typography variant="body2">{zone.name} ID: {zone.id}</Typography>
                                                        {
                                                            isManagerFor(currentUser, zone.id)
                                                                ? <IconButton color="error" onClick={() => { removeStaffPerms(zone.id) }}>
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                                : null
                                                        }
                                                    </Stack>
                                                </Card>
                                            );
                                        })
                                }
                            </Stack>
                            <Stack direction="row" spacing={1}>
                                <FormControl fullWidth>
                                    <InputLabel id="add-staff-permissions">Makerspace</InputLabel>
                                    <Select
                                        id="add-staff-permissions"
                                        label="Makerspace"
                                        onChange={(e) => setAddStaffPerms(Number(e.target.value))}
                                        fullWidth
                                    >
                                        {
                                            potentialStaffZones.map((zone: FullZone) => {
                                                return <MenuItem value={zone.id}>{zone.name} ID: {zone.id}</MenuItem>
                                            })
                                        }
                                    </Select>
                                </FormControl>
                                <Button variant="contained" color="success" onClick={handleAddStaffPerms} startIcon={<PersonAddIcon />}>
                                    Add
                                </Button>
                            </Stack>
                        </Stack>
                        <Stack spacing={1}>
                            <Typography variant="subtitle1" fontWeight="bold">Trainer</Typography>
                            <Stack direction="row" spacing={1}>
                                {
                                    props.user.trainer.length === 0
                                        ? <Alert severity="info">Not a Trainer!</Alert>
                                        : props.user.trainer.map((equipmentID: number) => (
                                            <TrainerCard equipmentID={equipmentID} removeTrainerPerms={removeTrainerPerms} />
                                        ))
                                }
                            </Stack>
                            <Stack direction="row" spacing={1}>
                                <FormControl fullWidth>
                                    <InputLabel id="add-trainer-permissions">Equipment</InputLabel>
                                    <TrainerEquipmentSelect user={props.user} setAddTrainerPerms={setAddTrainerPerms} />
                                </FormControl>
                                <Button variant="contained" color="success" onClick={handleAddTrainerPerms} startIcon={<PersonAddIcon />}>
                                    Add
                                </Button>
                            </Stack>
                        </Stack>
                    </Stack>
                );
            }}
            />
        </Stack>
    );
}
