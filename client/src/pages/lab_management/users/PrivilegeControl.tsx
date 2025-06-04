import { Alert, Button, Card, Checkbox, FormControl, FormGroup, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { FormControlLabel } from "@material-ui/core";
import { ChangeEvent, ReactElement, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { MAKE_USER_MANAGER, MAKE_USER_STAFF, REVOKE_USER_MANAGER, REVOKE_USER_STAFF, SET_USER_ADMIN } from "../../../queries/permissionQueries";
import { FullZone, GET_FULL_ZONES } from "../../../queries/zoneQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { isManager } from "../../../common/PrivilegeUtils";
import DeleteIcon from '@mui/icons-material/Delete';
import { GET_USER } from "./UserModal";


interface PrivilegeControlProps {
    user: any;
    isMobile: boolean;
}

export default function PrivilegeControl(props: PrivilegeControlProps) {
    const currentUser = useCurrentUser();

    const [adminState, setAdminState] = useState(props.user.admin);
    const [setAdmin] = useMutation(SET_USER_ADMIN, {refetchQueries: [{query: GET_USER, variables: {id: props.user.id}}]});

    function handleAdminChange(e: ChangeEvent<{}>, checked: boolean) {
        setAdminState(checked);
        setAdmin({variables: {userID: props.user.id, admin: checked}})
    }

    const getZonesResult = useQuery(GET_FULL_ZONES);
    
    const [makeUserManager] = useMutation(MAKE_USER_MANAGER, {refetchQueries: [{query: GET_USER, variables: {id: props.user.id}}]});
    const [revokeUserManager] = useMutation(REVOKE_USER_MANAGER, {refetchQueries: [{query: GET_USER, variables: {id: props.user.id}}]});
    const [addManagerPerms, setAddManagerPerms] = useState(-1);

    async function handleAddManagerPerms() {
        if (addManagerPerms === -1) {
            alert("Makerspace cannot be empty, please select a makerspace");
            return;
        }
        await makeUserManager({
            variables: {userID: props.user.id, makerspaceID: addManagerPerms},
        });
        //window.location.reload();
    }

    async function removeManagerPerms(makerspaceID: number) {
        await revokeUserManager({variables: {userID: props.user.id, makerspaceID: makerspaceID}});
    }

    const [makeUserStaff] = useMutation(MAKE_USER_STAFF);
    const [revokeUserStaff] = useMutation(REVOKE_USER_STAFF);
    const [addStaffPerms, setAddStaffPerms] = useState(-1);

    async function handleAddStaffPerms() {
        if (addStaffPerms === -1) {
            alert("Makerspace cannot be empty, please select a makerspace");
            return;
        }
        await makeUserStaff({variables: {userID: props.user.id, makerspaceID: addStaffPerms}});
    }

    async function removeStaffPerms(makerspaceID: number) {
        await revokeUserStaff({variables: {userID: props.user.id, makerspaceID: makerspaceID}});
    }

    return (
        <Stack>
            <Typography variant="h6" component="div">
                Permissions
            </Typography>
            <FormGroup>
                <FormControlLabel
                    label="Admin"
                    checked={adminState}
                    control={<Checkbox/>}
                    disabled={!currentUser.admin || props.user.id === currentUser.id}
                    onChange={handleAdminChange}
                />
            </FormGroup>
            <RequestWrapper2 result={getZonesResult} render={(data) => {

                const fullZones: FullZone[] = data.zones;

                const managerZones = fullZones.filter((zone: FullZone) => props.user.manager.includes(Number(zone.id)));
                const potentialManagerZones = fullZones.filter((zone: FullZone) => !props.user.manager.includes(Number(zone.id)) && isManager(currentUser, zone.id));
                const staffZones = fullZones.filter((zone: FullZone) => props.user.staff.includes(Number(zone.id)));
                const potentialStaffZones = fullZones.filter((zone: FullZone) => !props.user.staff.includes(Number(zone.id)) && isManager(currentUser, zone.id));

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
                                            <Card sx={{maxWidth: "200px", padding: "10px"}}>
                                                <Stack direction={props.isMobile ? "column" : "row"} justifyContent="space-between">
                                                    <Typography variant="body2">{zone.name} ID: {zone.id}</Typography>
                                                    {
                                                        isManager(currentUser, zone.id) && !(currentUser.id == props.user.id)
                                                        ? <IconButton color="error" onClick={() => {removeManagerPerms(zone.id)}}>
                                                            <DeleteIcon/>
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
                                <Button variant="contained" color="success" onClick={handleAddManagerPerms}>
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
                                            <Card sx={{maxWidth: "200px", padding: "10px"}}>
                                                <Stack direction={props.isMobile ? "column" : "row"} justifyContent="space-between">
                                                    <Typography variant="body2">{zone.name} ID: {zone.id}</Typography>
                                                    {
                                                        isManager(currentUser, zone.id)
                                                        ? <IconButton color="error" onClick={() => {removeStaffPerms(zone.id)}}>
                                                            <DeleteIcon/>
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
                                <Button variant="contained" color="success" onClick={handleAddStaffPerms}>
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
