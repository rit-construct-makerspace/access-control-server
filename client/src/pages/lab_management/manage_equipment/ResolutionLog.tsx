import { useState } from "react";
import { Box, Button, FormControlLabel, InputLabel, MenuItem, Select, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, TextField, Typography } from "@mui/material";
import { useMutation, useQuery } from "@apollo/client";
import RequestWrapper from "../../../common/RequestWrapper";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CREATE_RESOLUTION_LOG, DELETE_MAINTENANCE_LOG, GET_MAINTENANCE_LOGS, GET_MAINTENANCE_TAGS, GET_RESOLUTION_LOGS, ResolutionLogItem } from "../../../queries/maintenanceLogQueries";
import AdminPage from "../../AdminPage";
import LabelIcon from '@mui/icons-material/Label';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import MaintenanceTagsModal from "./MaintenanceTagsModal";
import { EquipmentInstance, GET_EQUIPMENT_INSTANCES, SET_INSTANCE_STATUS } from "../../../queries/equipmentInstanceQueries";
import ResolutionLogEntry from "./ResolutionLogEntry";
import EquipmentInstancesModal from "./EquipmentInstancesModal";
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';





export default function ResolutionLogPage() {
  const equipmentID = useParams<{ logid: string }>().logid;

  const [issueParams, setIssueParams] = useSearchParams();


  const [newContent, setNewContent] = useState<string>("");
  const [newIssue, setNewIssue] = useState<string>(issueParams.get("issue") ?? "");
  const instNum = Number(issueParams.get("instance"));
  const [newInstance, setNewInstance] = useState<number | undefined>(isNaN(instNum) ? undefined : instNum);
  const [markInstanceActive, setMarkInstanceActive] = useState<boolean>(true);

  const issueID = issueParams.get("id");
  const [autoDelete, setAutoDelete] = useState<boolean>(!!issueParams.get("id"));

  const navigate = useNavigate();

  const resolutionLogsQueryResult = useQuery(GET_RESOLUTION_LOGS, { variables: { equipmentID } });
  const maintenanceTagsResult = useQuery(GET_MAINTENANCE_TAGS, {variables: {equipmentID}});
  const instancesQueryResult = useQuery(GET_EQUIPMENT_INSTANCES, { variables: { equipmentID } });

  const [createResolutionLog] = useMutation(CREATE_RESOLUTION_LOG, { refetchQueries: [{ query: GET_RESOLUTION_LOGS, variables: { equipmentID } }] });
  const [deleteIssueLog] = useMutation(DELETE_MAINTENANCE_LOG);
  const [setInstanceNeedsRepairs] = useMutation(SET_INSTANCE_STATUS, {variables: {id: newInstance, status: "ACTIVE"}, refetchQueries: [{query: GET_EQUIPMENT_INSTANCES, variables: { equipmentID } }]}) 

  const [tagModalOpen, setTagModalOpen] = useState(false);

  const [timestampSort, setTimestampSort] = useState<'asc' | 'desc'>('desc');
  const [authorSort, setAuthorSort] = useState<'asc' | 'desc'>('desc');

  function handleSubmit() {
    createResolutionLog({ variables: { equipmentID, issue: newIssue, content: newContent, instanceID: (newInstance) } }).then(() => {
      if (issueID && autoDelete) deleteIssueLog({variables: {id: issueID}, refetchQueries: [{query: GET_MAINTENANCE_LOGS, variables: {equipmentID}}]});
      if (newInstance && markInstanceActive) {
        setInstanceNeedsRepairs();
      }

      setNewContent("");
      setNewIssue("");
      setNewInstance(undefined);
      setIssueParams(undefined);
    });
  }

  const [instancesModalOpen, setInstancesModalOpen] = useState<boolean>(false);

  return (
    <AdminPage title="Resolution Log" topRightAddons={[<Button startIcon={<KeyboardReturnIcon />} color="secondary" onClick={() => navigate(`/admin/equipment/issues/${equipmentID}`)}>Back to Issues</Button>, <Button startIcon={<LabelIcon />} onClick={() => setTagModalOpen(true)}>Manage Tags</Button>, <Button color="info" startIcon={<AutoAwesomeMotionIcon />} onClick={() => {setInstancesModalOpen(true)}}>Manage Instances</Button>]}>
      <RequestWrapper loading={resolutionLogsQueryResult.loading} error={resolutionLogsQueryResult.error}>
        <Box width={"100%"}>
          <Box width={"100%"}>
            <Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      key={0}
                    >

                    </TableCell>
                    <TableCell>
                      Instance
                    </TableCell>
                    <TableCell
                      align={'left'}
                      sortDirection={timestampSort}
                      width={"70px"}
                    >
                      <TableSortLabel
                        direction={timestampSort}
                        onClick={() => setTimestampSort(timestampSort === 'asc' ? 'desc' : 'asc')}
                      >
                        Timestamp
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      align={'left'}
                    >
                      Tags
                    </TableCell>
                    <TableCell
                      align={'left'}
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
                      align={'left'}
                    >
                      Issue
                    </TableCell>
                    <TableCell
                      align={'left'}
                    >
                      Resolution
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resolutionLogsQueryResult.data && resolutionLogsQueryResult.data.getResolutionLogsByEquipment.map((item: ResolutionLogItem) => (
                    <ResolutionLogEntry logItem={item} allTags={maintenanceTagsResult.data?.getMaintenanceTags ?? []} />
                  ))}
                  {(!resolutionLogsQueryResult.data || (resolutionLogsQueryResult.data.getResolutionLogsByEquipment.length === 0)) && <Typography variant="h6" color={"secondary"} p={3}>No logs.</Typography>}
                </TableBody>
              </Table>
            </Box>

            <Stack direction={"row"} px={2} spacing={2} mt={5}>
              <Stack direction={"column"} width={"15%"}>
                <InputLabel>Instance</InputLabel>
                <RequestWrapper loading={instancesQueryResult.loading} error={instancesQueryResult.error}>
                  <Select 
                    value={newInstance} 
                    onChange={(e) => setNewInstance(Number(e.target.value))} 
                    fullWidth 
                    defaultValue={(instancesQueryResult.data?.equipmentInstances.length === 1) 
                                    ? instancesQueryResult.data?.equipmentInstances[0].id
                                    : (isNaN(instNum) ? null : instNum)}>
                    
                    {instancesQueryResult.data?.equipmentInstances
                    .map((instance: EquipmentInstance) => (
                      <MenuItem 
                        value={instance.id} 
                        defaultChecked={instancesQueryResult.data?.equipmentInstances.length === 1}>{instance.name}
                      </MenuItem>
                    ))}
                  </Select>
                </RequestWrapper>
              </Stack>
              <Stack direction={"column"} width={"37.5%"}>
                <InputLabel>Issue</InputLabel>
                <TextField
                  value={newIssue}
                  placeholder="Brief, without machine name"
                  fullWidth
                  onChange={(e: any) => setNewIssue(e.target.value)}
                ></TextField>
              </Stack>
              <Stack direction={"column"} width={"37.5%"}>
                <InputLabel>Resolution</InputLabel>
                <TextField
                  value={newContent}
                  placeholder="Steps taken to resolve/mitigate"
                  fullWidth
                  onChange={(e: any) => setNewContent(e.target.value)}
                ></TextField>
              </Stack>
              <Stack direction={"column"} width={"10%"} spacing={1}>
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
            <Stack direction={"row"} justifyContent={"space-between"}>
              {newInstance && <FormControlLabel control={<Switch value={markInstanceActive} defaultChecked onChange={() => setMarkInstanceActive(!markInstanceActive)} />} label={`Mark instance as "ACTIVE"?`} />}
              {issueID && <FormControlLabel sx={{alignSelf: "flex-end"}} control={<Switch checked={autoDelete} onChange={() => setAutoDelete(!autoDelete)} />} label={"Automatically delete forwarded issue?"} />}
            </Stack>
          </Box>
        </Box>
      </RequestWrapper>

      <MaintenanceTagsModal tagModalOpen={tagModalOpen} setTagModalOpen={setTagModalOpen} equipmentID={Number(equipmentID)} />
      <EquipmentInstancesModal equipmentID={Number(equipmentID)} equipmentName={""} isOpen={instancesModalOpen} setIsOpen={setInstancesModalOpen} />
    </AdminPage>
  );
}

