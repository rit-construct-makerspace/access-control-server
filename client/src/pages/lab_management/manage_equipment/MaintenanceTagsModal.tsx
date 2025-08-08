import PrettyModal from "../../../common/PrettyModal";
import { useMutation, useQuery } from "@apollo/client";
import { Button, Chip, FormControlLabel, InputLabel, MenuItem, Select, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { CREATE_MAINTENANCE_TAG, GET_MAINTENANCE_TAGS, MaintenanceTag } from "../../../queries/maintenanceLogQueries";
import MaintenanceTagRow from "./MaintenanceTagRow";
import { useState } from "react";
import RequestWrapper from "../../../common/RequestWrapper";


const CHIP_COLORS: ("default" | "primary" | "secondary" | "warning" | "info" | "error" | "success")[] = ["primary", "secondary", "warning", "info", "error", "success"];

export default function MaintenanceTagsModal({ tagModalOpen, setTagModalOpen, equipmentID }: { tagModalOpen: boolean, setTagModalOpen: React.Dispatch<React.SetStateAction<boolean>>, equipmentID: number }) {
  const maintenanceTagsResult = useQuery(GET_MAINTENANCE_TAGS, { variables: { equipmentID } });

  const maintenanceTags = maintenanceTagsResult.data?.getMaintenanceTags ?? [];

  const [createTag] = useMutation(CREATE_MAINTENANCE_TAG, { refetchQueries: [{ query: GET_MAINTENANCE_TAGS, variables: { equipmentID } }], awaitRefetchQueries: true });

  const [newLabel, setNewLabel] = useState<string>("");
  const [newColor, setNewColor] = useState<"default" | "primary" | "secondary" | "warning" | "info" | "error" | "success">("primary");
  const [equipmentRestrict, setEquipmentRestrict] = useState<boolean>(true);

  function handleCreateSubmit() {
    createTag({
      variables: {
        label: newLabel,
        color: newColor,
        equipmentID: !equipmentRestrict ? null : equipmentID
      }
    });

    setNewLabel("");
    setNewColor("primary");
  }

  return (
    <PrettyModal
      open={tagModalOpen}
      onClose={() => setTagModalOpen(false)}
      width={600}
    >
      <Typography variant="h5">Tags</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell>Equipment</TableCell>
            <TableCell>Label</TableCell>
            <TableCell>Color</TableCell>
          </TableRow>
        </TableHead>
        <RequestWrapper loading={maintenanceTagsResult.loading} error={maintenanceTagsResult.error}>
          <TableBody>
            {maintenanceTags.map((tag: MaintenanceTag) => (
              <MaintenanceTagRow id={tag.id} label={tag.label} color={tag.color} equipment={tag.equipment} openedEquipmentID={equipmentID} />
            ))}
            {maintenanceTags.length === 0 && <Typography variant="h6">No tags.</Typography>}
          </TableBody>
        </RequestWrapper>
      </Table>
      <Stack direction={"column"} mt={3} width={"50%"}>
        <Typography>Create New Tag</Typography>
        <>
          <InputLabel>Label</InputLabel>
          <TextField value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
        </>
        <>
          <InputLabel>Color</InputLabel>
          <Select value={newColor} onChange={(e) => setNewColor(e.target.value as ("default" | "primary" | "secondary" | "warning" | "info" | "error" | "success"))}>
            {CHIP_COLORS.map((selColor: any) => (<MenuItem value={selColor}><Chip variant="outlined" color={selColor} label={selColor} /></MenuItem>))}
          </Select>
        </>
        <>
          <FormControlLabel control={<Switch checked={equipmentRestrict} onChange={() => setEquipmentRestrict(!equipmentRestrict)} />} label={`Restrict to this equipment only?`} />
        </>
        <Button variant="outlined" onClick={handleCreateSubmit}>Add Tag</Button>
      </Stack>
    </PrettyModal>
  );
}
