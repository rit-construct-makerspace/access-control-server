import { useMutation } from "@apollo/client";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { DELETE_MAINTENANCE_TAG, GET_MAINTENANCE_TAGS, UPDATE_MAINTENANCE_TAG } from "../../../queries/maintenanceLogQueries";
import { Chip, MenuItem, Select, Stack, TableCell, TableRow, TextField } from "@mui/material";
import { useState } from "react";
import ActionButton from "../../../common/ActionButton";
import AuditLogEntity from "../audit_logs/AuditLogEntity";

const CHIP_COLORS: ("default" | "primary" | "secondary" | "warning" | "info" | "error" | "success")[] = ["primary", "secondary", "warning", "info", "error", "success"];

export default function MaintenanceTagRow(props: { id: number, equipment: {id: number, name: string}, label: string, color: string, openedEquipmentID: number }) {
  const [allowEdits, setAllowEdits] = useState(false);
  //State-controlled attributes to detect changes and update accordingly
  const [label, setLabel] = useState(props.label);
  const [color, setColor] = useState<"default" | "primary" | "secondary" | "warning" | "info" | "error" | "success">(props.color as ("default" | "primary" | "secondary" | "warning" | "info" | "error" | "success"));

  const [deleteTag] = useMutation(DELETE_MAINTENANCE_TAG, { variables: {id: props.id}, refetchQueries: [{ query: GET_MAINTENANCE_TAGS, variables: {equipmentID: props.openedEquipmentID} }], awaitRefetchQueries: true });

  const [updateTag] = useMutation(UPDATE_MAINTENANCE_TAG, { refetchQueries: [{ query: GET_MAINTENANCE_TAGS, variables: {equipmentID: props.openedEquipmentID} }], awaitRefetchQueries: true });

  async function handleUpdateCancel() {
    //Reset attributes to original states
    setLabel(props.label);
    setColor(props.color as ("default" | "primary" | "secondary" | "warning" | "info" | "error" | "success"));
    setAllowEdits(false);
  }

  async function handleUpdateSubmit() {
    updateTag({variables: {
      id: props.id,
      label,
      color
    }});
    setAllowEdits(false);
  }

  async function handleDelete() {
    await deleteTag();
    return;
  }

  async function handleAllowEdit() {
    setAllowEdits(true)
    return;
  }

  return (
    <TableRow>
      <TableCell>
      {!allowEdits
        ? <Stack direction={"row"}>
            <ActionButton color="error" handleClick={handleDelete} iconSize={35} buttonText="" tooltipText={"Delete Tag"} appearance={"icon-only"} loading={false}><DeleteIcon /></ActionButton>
            <ActionButton color="success" handleClick={handleAllowEdit} iconSize={35} buttonText="" tooltipText={"Edit Tag"} appearance={"icon-only"} loading={false}><EditIcon /></ActionButton>
          </Stack>
        : <Stack direction={"row"}>
            <ActionButton color="error" handleClick={handleUpdateCancel} iconSize={35} buttonText="" tooltipText={"Cancel"} appearance={"icon-only"} loading={false}><CloseIcon /></ActionButton>
            <ActionButton color="success" handleClick={handleUpdateSubmit} iconSize={35} buttonText="" tooltipText={"Submit"} appearance={"icon-only"} loading={false}><CheckIcon /></ActionButton>
          </Stack>
      }
      </TableCell>
      <TableCell>
        {props.equipment ? <AuditLogEntity entityCode={`equipment:${props.equipment.id}:${props.equipment.name}`} /> : <i>GLOBAL</i>}
      </TableCell>
      <TableCell>
      {allowEdits
        ? <TextField value={label} onChange={(e) => setLabel(e.target.value)} />
        : label
      }
      </TableCell>
      <TableCell>
      {allowEdits
        ? <Select value={color} onChange={(e) => setColor(e.target.value as ("default" | "primary" | "secondary" | "warning" | "info" | "error" | "success"))}>
            {CHIP_COLORS.map((selColor: any) => (<MenuItem value={selColor}><Chip variant="outlined" color={selColor} label={selColor}/></MenuItem>))}
          </Select>
        : <Chip variant="outlined" color={color as ("default" | "primary" | "secondary" | "warning" | "info" | "error" | "success")} label={label} /> 
      }
      </TableCell>
    </TableRow>
  );
}
