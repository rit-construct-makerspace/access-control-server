import { Button, Card, IconButton, Link, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { DELETE_EQUIPMENT_INSTANCE, EquipmentInstance, GET_EQUIPMENT_INSTANCES, InstanceStatus, UPDATE_INSTANCE } from "../../../queries/equipmentInstanceQueries";
import ActionButton from "../../../common/ActionButton";
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { useMutation, useQuery } from "@apollo/client";
import { GET_UNPAIRED_READERS } from "../../../queries/readersQueries";
import { useState } from "react";
import BlockIcon from '@mui/icons-material/Block';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import AuditLogEntity from "../../lab_management/audit_logs/AuditLogEntity";
import { AccessController, AccessControllerState, GET_ACCESS_CONTROLLER_BY_ID, SET_CORE_STATE } from "../../../queries/deviceQueries";

interface EquipmentInstanceCardProps {
  instance: EquipmentInstance;
}

export default function EquipmentInstanceCard(props: EquipmentInstanceCardProps) {
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

  const currentAccessControllerResult = useQuery(GET_ACCESS_CONTROLLER_BY_ID, {
    pollInterval: 15000,
    variables: { accessControllerID: props.instance.accessController?.id }
  });
  const currentAccessController: AccessController | undefined = currentAccessControllerResult.data?.getAccessControllerByID;


  const [sendCommandedState] = useMutation(SET_CORE_STATE);
  const [commandedState, setCommandedState] = useState<string>("IDLE");


  async function handleSave() {
    setAllowEdit(false);
    updateInstance({ variables: { id: props.instance.id, name: name, status: status } })
  }

  async function handleCancel() {
    setAllowEdit(false);
    setName(props.instance.name);
    setStatus(props.instance.status);
  }

  function handleStateChange(e: any) {
    setCommandedState(e.target.value);
  }
  function setStateClicked(_e: any) {
    if (currentAccessController != null) {
      sendCommandedState({ variables: { deviceID: props.instance.accessController.device?.id, targetState: commandedState } });
    }
  }


  async function handleDeleteInstance() {
    await deleteInstance({ variables: { id: props.instance.id } });
  }

  function activeUserDisplay() {
    if (!currentAccessController) {
      return "No User";
    }
    if (!currentAccessController.core?.activeUser) {
      if (currentAccessController.state === AccessControllerState.ALWAYS_ON || currentAccessController.state === AccessControllerState.UNLOCKED) {
        return "Unlocked with no user";
      } else {
        return "No User";
      }
    }
    return <Stack direction={"row"}>
      User:&nbsp;
      <AuditLogEntity entityCode={`user:${currentAccessController.core?.activeUser.id}:${currentAccessController.core?.activeUser?.firstName} ${currentAccessController.core?.activeUser?.lastName}`} />
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
          <Link href={`/app/makerspace/${currentAccessController?.device.makerspaceID}/devices?q=${currentAccessController?.device.name}`}>{`${currentAccessController?.device.name}:${currentAccessController?.channelID}`}</Link>
          {activeUserDisplay()}
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems={"center"} spacing={1}>
          <Select disabled={allowEdit || currentAccessController === undefined} size="small" defaultValue={currentAccessController?.state ?? AccessControllerState.IDLE} value={commandedState} onChange={handleStateChange} fullWidth>
            <MenuItem value={AccessControllerState.IDLE}>Idle</MenuItem>
            <MenuItem value={AccessControllerState.LOCKED_OUT}>Locked Out</MenuItem>
            <MenuItem value={AccessControllerState.ALWAYS_ON}>Always On</MenuItem>
          </Select>
          <IconButton disabled={allowEdit || currentAccessController === undefined} onClick={setStateClicked} color="secondary">
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