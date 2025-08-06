import { Card, Stack, Typography, Select, MenuItem, TextField } from "@mui/material";
import ActionButton from "../../../common/ActionButton";
import { DELETE_EQUIPMENT_INSTANCE, EquipmentInstance, GET_EQUIPMENT_INSTANCES, InstanceStatus, SET_INSTANCE_NAME, SET_INSTANCE_STATUS } from "../../../queries/equipmentInstanceQueries";
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { useState } from "react";
import { useMutation } from "@apollo/client";

interface EquipmentInstanceRowProps {
  instance: EquipmentInstance;
  isMobile: boolean;
}

export default function EquipmentInstanceRow(props: EquipmentInstanceRowProps) {
  const [status, setStatus] = useState<InstanceStatus>(props.instance.status);
  const [state, setState] = useState("IDLE");
  
  const [name, setName] = useState<string>(props.instance.name);
  const [allowRename, setAllowRename] = useState<boolean>(false);

  const [setInstanceStatus] = useMutation(SET_INSTANCE_STATUS, { refetchQueries: [{ query: GET_EQUIPMENT_INSTANCES, variables: {equipmentID: props.instance.equipment.id} }] });
  const [setInstanceName] = useMutation(SET_INSTANCE_NAME, { refetchQueries: [{ query: GET_EQUIPMENT_INSTANCES, variables: {equipmentID: props.instance.equipment.id} }] });
  const [deleteInstance] = useMutation(DELETE_EQUIPMENT_INSTANCE, { refetchQueries: [{ query: GET_EQUIPMENT_INSTANCES, variables: {equipmentID: props.instance.equipment.id} }] });


  function handleStatusChange(e: any) {
    setStatus(e.target.value);
    setInstanceStatus({ variables: { id: props.instance.id, status: e.target.value } })
  }

  function handleStateChange(e: any) {
    setState(e.target.value);
  }

  async function handlenameChangeSubmit() {
    setAllowRename(false);
    setInstanceName({ variables: { id: props.instance.id, name } })
  }

  async function handlenameChangeCancel() {
    setAllowRename(false);
    setName(props.instance.name)
  }

  return (
    <Card sx={{p: 2}}>
      <Stack direction={props.isMobile ? "column" : "row"} spacing={2} alignItems={"center"} justifyContent={"space-between"} sx={{ width: "100%" }}>
        <Stack direction={props.isMobile ? "column" : "row"} alignItems={"center"} spacing={2}>
          {!allowRename ? <Typography variant="h6" fontWeight={"bold"} width={150}>{props.instance.name}</Typography>
            : <TextField size="small" value={name} onChange={(e) => setName(e.target.value)}></TextField>}
          <Select size="small" defaultValue={props.instance.status} value={status} onChange={handleStatusChange} sx={{width: "165px"}}>
            <MenuItem value={InstanceStatus.ACTIVE}>{InstanceStatus.ACTIVE}</MenuItem>
            <MenuItem value={InstanceStatus.NEEDS_REPAIRS}>{InstanceStatus.NEEDS_REPAIRS}</MenuItem>
            <MenuItem value={InstanceStatus.UNDER_REPAIRS}>{InstanceStatus.UNDER_REPAIRS}</MenuItem>
            <MenuItem value={InstanceStatus.TESTING}>{InstanceStatus.TESTING}</MenuItem>
            <MenuItem value={InstanceStatus.UNDEPLOYED}>{InstanceStatus.UNDEPLOYED}</MenuItem>
            <MenuItem value={InstanceStatus.RETIRED}>{InstanceStatus.RETIRED}</MenuItem>
          </Select>
          <Select size="small" defaultValue={"IDLE"} value={state} onChange={handleStateChange} sx={{width: "140px"}}>
            <MenuItem value="IDLE">IDLE</MenuItem>
            <MenuItem value="LOCKOUT">LOCKOUT</MenuItem>
            <MenuItem value="ALWAYS ON">ALWAYS ON</MenuItem>
          </Select>
        </Stack>
        <Typography variant="body1">temporary-fading-slug</Typography>
        <Stack direction={"row"} alignSelf={"flex-end"} spacing={2} alignItems={"center"}>
          {!allowRename
            ? <>
              <ActionButton iconSize={20} color={"primary"} appearance={"icon-only"} tooltipText="Rename" handleClick={async () => setAllowRename(true)}
                loading={false}><DriveFileRenameOutlineIcon /></ActionButton>
            </>
            : <>
              <ActionButton iconSize={20} color={"success"} appearance={"icon-only"} tooltipText="Submit" handleClick={handlenameChangeSubmit}
                loading={false}><CheckIcon /></ActionButton>
              <ActionButton iconSize={20} color={"error"} appearance={"icon-only"} tooltipText="Cancel" handleClick={handlenameChangeCancel}
                loading={false}><CloseIcon /></ActionButton>
            </>
          }
        </Stack>
      </Stack>
    </Card>
  )
}