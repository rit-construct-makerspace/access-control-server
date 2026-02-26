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
import AuditLogEntity from "../../lab_management/audit_logs/AuditLogEntity";
import { useIsMobile } from "../../../common/IsMobileProvider";

interface EquipmentInstanceCardProps {
  instance: EquipmentInstance;
}

export default function EquipmentInstanceCard(props: EquipmentInstanceCardProps) {
  const isMobile = useIsMobile();

  const unpairedReaderResult = useQuery(GET_UNPAIRED_READERS)
  const unpairedReaders: Reader[] | null = unpairedReaderResult?.data?.unpairedReaders;

  const [deleteInstance] = useMutation(DELETE_EQUIPMENT_INSTANCE, {
    refetchQueries: ["EquipmentInstances", "GetUnpairedReaders"]
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

  const currentReaderResult = useQuery(GET_READER_BY_ID, {
    pollInterval: 2000,
    variables: { id: props.instance.reader?.id },
  });
  const currentReader: Reader | undefined = currentReaderResult.data?.reader;


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
      sendCommandedState({ variables: { id: reader.id, state: commandedState } });
    }
  }


  async function handleDeleteInstance() {
    await deleteInstance({ variables: { id: props.instance.id } });
  }

  function activeUserDisplay() {
    if (!currentReader) {
      return "No User";
    }
    if (!currentReader.user) {
      if (currentReader.state === "AlwaysOn" || currentReader.state === "Unlocked") {
        return "Unlocked with no user";
      } else {
        return "No User";
      }
    }
    return <Stack direction={"row"}>
      User:&nbsp;
      <AuditLogEntity entityCode={`user:${currentReader.user.id}:${currentReader.user.firstName} ${currentReader.user.lastName}`} />
    </Stack>
  }

  return (
    <Card sx={{ padding: "15px" }} >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent={"space-between"}>
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
        <Stack alignContent={"center"} alignItems={"center"}>
          {activeUserDisplay()}
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
                <span>Paired with: <AuditLogEntity entityCode={`access_device:${reader.id}:${reader.name}`} /></span>
                : <Alert severity="warning" variant="filled">No Reader Paired</Alert>}
            </Typography>
        }
        <Stack direction="row" justifyContent="space-between" alignItems={"center"} spacing={1}>
          <Select disabled={allowEdit || reader == null} size="small" defaultValue={currentReader?.state ?? "Idle"} value={commandedState} onChange={handleStateChange} fullWidth>
            <MenuItem value="Idle">Idle</MenuItem>
            <MenuItem value="Lockout">Lockout</MenuItem>
            <MenuItem value="AlwaysOn">Always On</MenuItem>
            <MenuItem value="Restart">Restart</MenuItem>
          </Select>
          <IconButton disabled={allowEdit || reader == null} onClick={setStateClicked} color="secondary">
            <SendIcon />
          </IconButton>
        </Stack>
        {
          allowEdit
            ? <Stack direction="row" justifyContent="space-between">
              <Button color="error" variant="contained" startIcon={<DeleteIcon />} onClick={handleDeleteInstance}>Delete</Button>
              <Button color="success" variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
            </Stack>
            : undefined
        }
      </Stack>
    </Card >
  );
}