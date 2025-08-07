import { Box, Button, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, TextField, Typography } from "@mui/material";
import { useMutation, useQuery } from "@apollo/client";
import RequestWrapper from "../../../common/RequestWrapper";
import { useNavigate } from "react-router-dom";
import { CREATE_MAINTENANCE_LOG, GET_MAINTENANCE_LOGS, GET_MAINTENANCE_TAGS, MaintenanceLogItem } from "../../../queries/maintenanceLogQueries";
import MaintenanceLogEntry from "./MaintenanceLogEntry";
import MaintenanceTagsModal from "./MaintenanceTagsModal";
import PrettyModal from "../../../common/PrettyModal";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { EquipmentInstance, GET_EQUIPMENT_INSTANCES, SET_INSTANCE_STATUS } from "../../../queries/equipmentInstanceQueries";
import CloseIcon from '@mui/icons-material/Close';
import { useState } from "react";

interface IsseueLogModalProps {
  open: boolean;
  equipmentID: string;
  onClose: () => void;
}

export default function IssueLogModal(props: IsseueLogModalProps) {
  const [newContent, setNewContent] = useState<string>("");
  const [newInstance, setNewInstance] = useState<number>();
  const [markInstanceNeedsRepairs, setMarkInstanceNeedsRepairs] = useState<boolean>(true);

  const navigate = useNavigate();

  const maintenanceLogsQueryResult = useQuery(GET_MAINTENANCE_LOGS, { variables: { equipmentID: props.equipmentID } });
  const maintenanceTagsResult = useQuery(GET_MAINTENANCE_TAGS, { variables: { equipmentID: props.equipmentID } });
  const instancesQueryResult = useQuery(GET_EQUIPMENT_INSTANCES, { variables: { equipmentID: props.equipmentID } });

  const [createLog] = useMutation(CREATE_MAINTENANCE_LOG, { refetchQueries: [{ query: GET_MAINTENANCE_LOGS, variables: { equipmentID: props.equipmentID } }] });
  const [setInstanceNeedsRepairs] = useMutation(SET_INSTANCE_STATUS, {variables: {id: newInstance, status: "NEEDS REPAIRS"}, refetchQueries: [{query: GET_EQUIPMENT_INSTANCES, variables: { equipmentID: props.equipmentID } }]}) 

  const [tagModalOpen, setTagModalOpen] = useState(false);

  const [timestampSort, setTimestampSort] = useState<'asc' | 'desc'>('desc');
  const [authorSort, setAuthorSort] = useState<'asc' | 'desc'>('desc');
  const [instanceSort, setInstanceSort] = useState<'asc' | 'desc'>('desc');

  function handleSubmit() {
    createLog({ variables: { equipmentID: props.equipmentID, content: newContent, instanceID: newInstance } });
    if (newInstance && markInstanceNeedsRepairs) {
      setInstanceNeedsRepairs();
    }

    setNewContent("");
    setNewInstance(undefined);
  }

  return (
    <PrettyModal
      open={props.open}
      onClose={props.onClose}
      width={800}
    >
      <RequestWrapper loading={maintenanceLogsQueryResult.loading} error={maintenanceLogsQueryResult.error}>
        <Box width={"100%"}>
          <Stack direction={"row"} justifyContent={"space-between"}>
            <Typography variant="h5">Issue Log</Typography>
            <Stack direction={"row"} spacing={2} alignItems="center">
              <Button variant="outlined" startIcon={<CheckCircleOutlineIcon />} color="secondary" onClick={() => navigate(`/admin/equipment/logs/${props.equipmentID}`)}>Resolution Log</Button>
              <IconButton onClick={props.onClose}>
                <CloseIcon/>
              </IconButton>
            </Stack>
          </Stack>
          <Box width={"100%"}>
            <Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      key={0}
                    >

                    </TableCell>
                    <TableCell
                      key={1}
                      sortDirection={timestampSort}
                    >
                      <TableSortLabel
                        direction={instanceSort}
                        onClick={() => setInstanceSort(instanceSort === 'asc' ? 'desc' : 'asc')}
                      >
                        Instance
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      key={1}
                      sortDirection={timestampSort}
                    >
                      <TableSortLabel
                        direction={timestampSort}
                        onClick={() => setTimestampSort(timestampSort === 'asc' ? 'desc' : 'asc')}
                      >
                        Timestamp
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      key={2}
                    >
                      Tags
                    </TableCell>
                    <TableCell
                      key={3}
                      sortDirection={authorSort}
                    >
                      <TableSortLabel
                        direction={authorSort}
                        onClick={() => setAuthorSort(authorSort === 'asc' ? 'desc' : 'asc')}
                      >
                        Author
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      key={4}
                    >
                      Description
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maintenanceLogsQueryResult.data && maintenanceLogsQueryResult.data.getMaintenanceLogsByEquipment.map((item: MaintenanceLogItem) => (
                    <MaintenanceLogEntry logItem={item} allTags={maintenanceTagsResult.data?.getMaintenanceTags ?? []} />
                  ))}
                  {(!maintenanceLogsQueryResult.data || (maintenanceLogsQueryResult.data.getMaintenanceLogsByEquipment.length === 0)) && <Typography variant="h6" color={"secondary"} p={3}>No logs.</Typography>}
                </TableBody>
              </Table>
            </Box>

            <Stack direction={"row"} px={2} spacing={2} mt={5}>
              <Stack direction={"column"} width={"25%"}>
                <InputLabel>Instance</InputLabel>
                <RequestWrapper loading={instancesQueryResult.loading} error={instancesQueryResult.error}>
                  <Select value={newInstance} onChange={(e) => setNewInstance(Number(e.target.value))} fullWidth defaultValue={instancesQueryResult.data?.equipmentInstances.length === 1 ? instancesQueryResult.data?.equipmentInstances[0].id: null}>
                    {instancesQueryResult.data?.equipmentInstances.map((instance: EquipmentInstance) => (
                      <MenuItem value={instance.id} defaultChecked={instancesQueryResult.data?.equipmentInstances.length === 1}>{instance.name}</MenuItem>
                    ))}
                  </Select>
                </RequestWrapper>
              </Stack>
              <Stack direction={"column"} width={"60%"}>
                <InputLabel>Description</InputLabel>
                <TextField
                  value={newContent}
                  placeholder="Brief, without machine name"
                  fullWidth
                  onChange={(e: any) => setNewContent(e.target.value)}
                ></TextField>
              </Stack>
              <Stack direction={"column"} width={"25%"} spacing={1}>
                <InputLabel>&nbsp;</InputLabel>
                <Button
                  fullWidth
                  sx={{ height: "90%" }}
                  variant="contained"
                  onClick={handleSubmit}
                >
                  Post
                </Button>
              </Stack>
            </Stack>
            {newInstance && <FormControlLabel sx={{width: "80%"}} control={<Switch value={markInstanceNeedsRepairs} defaultChecked onChange={() => setMarkInstanceNeedsRepairs(!markInstanceNeedsRepairs)} />} label={`Mark instance as "NEEDS REPAIRS"?`} />}
          </Box>
        </Box>
      </RequestWrapper>

      <MaintenanceTagsModal tagModalOpen={tagModalOpen} setTagModalOpen={setTagModalOpen} equipmentID={Number(props.equipmentID)} />
    </PrettyModal>
  );
}

