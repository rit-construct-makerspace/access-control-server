import { Alert, Autocomplete, Button, Card, IconButton, MenuItem, Select, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { DELETE_EQUIPMENT_INSTANCE, EquipmentInstance, GET_EQUIPMENT_INSTANCES, InstanceStatus, UPDATE_INSTANCE } from "../../../queries/equipmentInstanceQueries";
import ActionButton from "../../../common/ActionButton";
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';

import { useMutation, useQuery } from "@apollo/client";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { GET_READER_BY_ID, GET_UNPAIRED_READERS, Reader, SET_READER_STATE } from "../../../queries/readersQueries";
import { useEffect, useState } from "react";

import BlockIcon from '@mui/icons-material/Block';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import HourglassFullIcon from '@mui/icons-material/HourglassFull';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ReportProblemIcon from '@mui/icons-material/ReportProblemSharp';
import StarsIcon from '@mui/icons-material/Stars';
import PendingIcon from '@mui/icons-material/Pending';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import AuditLogEntity from "../audit_logs/AuditLogEntity";

interface EquipmentInstanceCardProps {
    instance: EquipmentInstance;
}

export default function EquipmentInstanceCard(props: EquipmentInstanceCardProps) {

    const unpairedReaderResult = useQuery(GET_UNPAIRED_READERS)
    const unpairedReaders: Reader[] | null = unpairedReaderResult?.data?.unpairedReaders;

    const [deleteInstance] = useMutation(DELETE_EQUIPMENT_INSTANCE, {
        refetchQueries: [{ query: GET_EQUIPMENT_INSTANCES, variables: { equipmentID: props.instance.equipment.id } },
        { query: GET_UNPAIRED_READERS }]
    });

    const [updateInstance] = useMutation(UPDATE_INSTANCE, {
        refetchQueries: [
            { query: GET_EQUIPMENT_INSTANCES, variables: { equipmentID: props.instance.equipment.id } },
            { query: GET_UNPAIRED_READERS }]
    });


    const [allowEdit, setAllowEdit] = useState(false);
    const [name, setName] = useState<string>(props.instance.name);
    const [status, setStatus] = useState<InstanceStatus>(props.instance.status);
    const [reader, setReader] = useState<{ id: number, name: string } | null>(props.instance.reader);

    const [isOffline, setIsOffline] = useState<boolean>(false);

    function calcIsOffline(lastStatusTime: string) {
        if (lastStatusTime != null) {
            const OFFLINE_CUTOFF_MS = 30 * 1000;
            const msSinceLastStatus = Date.now() - new Date(lastStatusTime).getTime()
            if (msSinceLastStatus > OFFLINE_CUTOFF_MS) {
                return true;
            }
        }
        return false;
    }

    const currentReader = useQuery(GET_READER_BY_ID, {
        pollInterval: 2000,
        variables: { id: props.instance.reader?.id },
    });


    useEffect(() => {
        function updateOfflineness() {
            const off = calcIsOffline(currentReader.data?.reader?.lastStatusTime);
            setIsOffline(off)
        }
        const interval = setInterval(updateOfflineness, 2000)

        return (() => { // cleanup function to stop pollin
            clearInterval(interval)
        })
    }, [currentReader.data?.reader?.lastStatusTime])


    const [sendCommandedState] = useMutation(SET_READER_STATE);
    const [commandedState, setCommandedState] = useState<string>("Idle");

    function generateDropdownOptions(): { id: number | undefined, name: string }[] {
        const options: { id: number | undefined, name: string }[] = [];

        if (props.instance.reader) {
            options.push({ name: props.instance.reader.name + " (Active)", id: props.instance.reader.id });
            options.push({ name: "Unpair From " + props.instance.reader.name, id: undefined });
        }
        if (unpairedReaders) {
            const asOptions = unpairedReaders.map((reader: Reader) => ({ id: reader.id, name: reader.name }));
            options.push(...asOptions);
        }
        return options;
    }

    async function handleSave() {
        setAllowEdit(false);
        updateInstance({ variables: { id: props.instance.id, name: name, status: status, readerID: reader?.id ?? null } })
    }

    async function handleCancel() {
        setAllowEdit(false);
        setName(props.instance.name);
        setStatus(props.instance.status);
        setReader(props.instance.reader);
    }

    function handleStateChange(e: any) {
        setCommandedState(e.target.value);
    }
    function setStateClicked(_e: any) {
        if (reader != null) {
            if (currentReader.data?.reader?.state === "Unlocked") {
                if (window.confirm("This machine is currently in use. Continue?")) {
                    sendCommandedState({ variables: { id: reader.id, state: commandedState } });
                }
            } else {
                sendCommandedState({ variables: { id: reader.id, state: commandedState } });
            }
        }
    }


    async function handleDeleteInstance() {
        await deleteInstance({ variables: { id: props.instance.id } });
        window.location.reload();
    }

    function renderCurrentState() {
        switch (currentReader.data?.reader?.state) {
            case "Idle":
                return <Tooltip title="Idle"><HourglassFullIcon color="warning" /></Tooltip>;
            case "Unlocked":
                return <Tooltip title="Unlocked"><LockOpenIcon color="success" /></Tooltip>;
            case "Lockout":
                return <Tooltip title="Lockout"><LockIcon color="error" /></Tooltip>;
            case "Restart":
                return <Tooltip title="Restart"><RestartAltIcon color="info" /></Tooltip>;
            case "Fault":
                return <Tooltip title="Fault"><ReportProblemIcon color="error" /></Tooltip>;
            case "AlwaysOn":
                return <Tooltip title="AlwaysOn"><StarsIcon color="success" /></Tooltip>;
            case "Startup":
                return <Tooltip title="Startup"><PendingIcon color="info" /></Tooltip>;
            default:
                return <Tooltip title="Unknown State"><QuestionMarkIcon color="secondary" /></Tooltip>
        }
    }

    return (
        <Card sx={{ padding: "15px" }}>
            <Stack spacing={2}>
                <Stack direction="row" alignItems="center" justifyContent={"space-between"} width="250px">
                    {
                        !allowEdit
                            ? <Typography variant="h6" fontWeight={"bold"}>{props.instance.name}</Typography>
                            : <TextField size="small" value={name} onChange={(e) => setName(e.target.value)}></TextField>
                    }
                    {
                        !allowEdit
                            ? <>
                                <ActionButton iconSize={20} color={"primary"} appearance={"icon-only"} tooltipText="Rename" handleClick={async () => setAllowEdit(true)}
                                    loading={false}><DriveFileRenameOutlineIcon /></ActionButton>
                            </>
                            : <>
                                <ActionButton iconSize={20} color={"error"} appearance={"icon-only"} tooltipText="Cancel" handleClick={handleCancel}
                                    loading={false}><BlockIcon /></ActionButton>
                            </>
                    }
                </Stack>
                {
                    allowEdit
                        ? <Autocomplete
                            renderInput={
                                (params: any) => <TextField {...params} label="Slug" />
                            }
                            getOptionLabel={(option) => option.name}
                            size="small"
                            options={generateDropdownOptions()}
                            onChange={(_, value) => setReader(value.id != null ? { id: value.id, name: value.name } : null)}
                            disableClearable
                            defaultValue={reader ?? { id: undefined, name: "No Reader" }}
                        />
                        : <Typography variant="body1" align="center">{
                            reader ?
                                <span>Paired with: <AuditLogEntity entityCode={`access_device:${reader.id}:${reader.name}`}/></span>
                                : <Alert severity="warning" variant="filled">No Reader Paired</Alert>}
                        </Typography>
                }
                {
                    isOffline ?
                        <Alert severity="warning" variant="filled" icon={<WifiOffIcon />}>Offline</Alert>
                        :
                        <Stack direction="row" justifyContent="space-between" alignItems={"center"} spacing={1}>
                            {
                                renderCurrentState()
                            }
                            <Select disabled={allowEdit || reader == null} size="small" defaultValue={currentReader.data?.reader?.state ?? "Idle"} value={commandedState} onChange={handleStateChange} fullWidth>
                                <MenuItem value="Idle">Idle</MenuItem>
                                <MenuItem value="Lockout">Lockout</MenuItem>
                                <MenuItem value="AlwaysOn">Always On</MenuItem>
                                <MenuItem value="Restart">Restart</MenuItem>
                            </Select>
                            <IconButton disabled={allowEdit || reader == null} onClick={setStateClicked} color="secondary">
                                <SendIcon />
                            </IconButton>
                        </Stack>
                }
                {
                    allowEdit
                        ? <Stack direction="row" justifyContent="space-between">
                            <Button color="error" variant="contained" startIcon={<DeleteIcon />} onClick={handleDeleteInstance}>Delete</Button>
                            <Button color="success" variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                        </Stack>
                        : undefined
                }
            </Stack>
        </Card>
    );
}