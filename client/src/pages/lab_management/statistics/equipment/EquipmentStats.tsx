import { useLazyQuery, useQuery } from "@apollo/client";
import { Box, Button, Collapse, CollapseProps, FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, styled, TextField, Tooltip } from "@mui/material";
import gql from "graphql-tag";
import { ReactElement, useEffect, useState } from "react";
import PageSectionHeader from "../../../../common/PageSectionHeader";
import GET_EQUIPMENTS from "../../../../queries/equipmentQueries";
import RequestWrapper from "../../../../common/RequestWrapper";
import Equipment from "../../../../types/Equipment";
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import RequestWrapper2 from "../../../../common/RequestWrapper2";
import AuditLogEntity from "../../audit_logs/AuditLogEntity";
import { format } from "date-fns";
import DownloadIcon from '@mui/icons-material/Download';
import { EquipmentStatCard } from "./EquipmentStatCard";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { JSX } from "react/jsx-runtime";
import { secondsToHumanString } from "../StatisticsFunctions";

const GET_VERBOSE_EQUIPMENT_SESSIONS = gql`
  query GetEquipmentSessionsWithAttachedEntities($startDate: String, $endDate: String, $equipmentIDs: [String]) {
    getEquipmentSessionsWithAttachedEntities(startDate: $startDate, endDate: $endDate, equipmentIDs: $equipmentIDs) {
      id
      start
      equipmentID
      userID
      userName
      sessionLength
      readerSlug
      equipmentName
      roomID
      roomName
      zoneID
      zoneName
    }
  }
`;

export interface VerboseEquipmentSession {
  id: number;
  start: Date;
  equipmentID: number;
  userID: number;
  userName: string; //First Initial + '. ' + Last Name
  sessionLength: number;
  readerSlug: string;
  equipmentName: string;
  roomID: number;
  roomName: string;
  zoneID: number;
  zoneName: string;
};


function joinEquipmentSession(obj: VerboseEquipmentSession) {
  return (obj.id + ', ' + obj.start + ', ' + obj.equipmentID + ', ' + obj.equipmentName + ', ' + obj.userID + ', ' + obj.userName + ', '
    + obj.sessionLength + ', ' + obj.readerSlug + ', ' + obj.roomID + ', ' + obj.roomName + ', ' + obj.zoneID + ', ' + obj.zoneName + ', ');
}


export function EquipmentStats() {
  const [width, setWidth] = useState<number>(window.innerWidth);
  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }
  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    }
  }, []);
  const isMobile = width <= 1100;

  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [equipmentIDs, setEquipmentIDs] = useState<string[]>([]);

  const [showClearButton, setShowClearButton] = useState<boolean>(false);
  const [cardContainerCollapsed, setCardContainerCollapsed] = useState<boolean>(true);

  const [getEquipmentSessions, getEquipmentSessionsResult] = useLazyQuery(GET_VERBOSE_EQUIPMENT_SESSIONS);

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setStartDate(e.target.value)
    if (startDate && startDate != "") setShowClearButton(true);
  }

  function handleEndDateChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEndDate(e.target.value)
    if (endDate && endDate != "") setShowClearButton(true);
  }

  function handleEquipmentIDsChange(e: SelectChangeEvent<string[]>) {
    setEquipmentIDs(e.target.value as string[])
    if (equipmentIDs && equipmentIDs.length > 0) setShowClearButton(true);
  }

  function handleClear() {
    setStartDate("");
    setEndDate("");
    setEquipmentIDs([]);
    setShowClearButton(false);
  }

  function handleSubmit() {
    var variables = {
      ...(startDate && startDate != "" && { startDate }),
      ...(endDate && endDate != "" && { endDate }),
      ...(equipmentIDs && equipmentIDs.length > 0 && { equipmentIDs })
    };
    getEquipmentSessions({ variables });
  }


  const download = (data: BlobPart, name: string) => {
    // Create a Blob with the CSV data and type
    const blob = new Blob([data], { type: 'text/csv' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create an anchor tag for downloading
    const a = document.createElement('a');

    // Set the URL and download attribute of the anchor tag
    a.href = url;
    a.download = name;

    // Trigger the download by clicking the anchor tag
    a.click();
  }

  function handleCSVExport() {
    let csvContent =
      Object.keys(getEquipmentSessionsResult.data.getEquipmentSessionsWithAttachedEntities[0] as VerboseEquipmentSession).map((s: string) => s == "__typename" ? '' : `${s},`).join('')
      + '\n' + getEquipmentSessionsResult.data.getEquipmentSessionsWithAttachedEntities.map((e: VerboseEquipmentSession) => joinEquipmentSession(e)).join("\n");
    download(csvContent, "equipmentSessions.csv");
  }

  function groupByReaderSlug(sessions: VerboseEquipmentSession[]): Record<string, VerboseEquipmentSession[]> {
    return sessions.reduce((acc, session) => {
      if (!acc[session.readerSlug]) {
        acc[session.readerSlug] = [];
      }
      acc[session.readerSlug].push(session);
      return acc;
    }, {} as Record<string, VerboseEquipmentSession[]>);
  };






  //Dropdown query
  const getEquipment = useQuery(GET_EQUIPMENTS);

  return (
    <Box width={"100%"}>
      <PageSectionHeader>Equipment Sessions</PageSectionHeader>

      <Stack direction={isMobile ? "column" : "row"} spacing={2}>
        <FormControl>
          <TextField
            label="Start"
            type="date"
            sx={{ width: 180 }}
            value={startDate}
            onChange={handleStartDateChange}
            focused
          />
        </FormControl>
        <FormControl>
          <TextField
            label="Stop"
            type="date"
            sx={{ width: 180 }}
            value={endDate}
            onChange={handleEndDateChange}
            focused
          />
        </FormControl>


        <RequestWrapper2 result={getEquipment} render={function (data: any): ReactElement {
          return (
            <FormControl sx={{ width: '25em' }}>
              <InputLabel id="es-stat_equipment-select_label">Equipment (Default is all)</InputLabel>
              <Select
                labelId="es-stat_equipment-select_label"
                value={equipmentIDs}
                label="Equipment"
                multiple
                onChange={handleEquipmentIDsChange}
              >
                {data.equipments.map((equipment: Equipment) => (
                  <MenuItem value={equipment.id}>{equipment.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )
        }} />

        <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ width: '10em' }}>Fetch</Button>

        <Tooltip title={getEquipmentSessionsResult.data ? "User, Equipment, Room, and Zone columns will be split into Names and IDs" : "Must Fetch data before exporting"}>
          <Button onClick={handleCSVExport} startIcon={<DownloadIcon />} variant="outlined" color="secondary" sx={{ width: '10em' }} disabled={!getEquipmentSessionsResult.data}>Export as CSV</Button>
        </Tooltip>

        {showClearButton && (
          <IconButton onClick={handleClear} sx={{ ml: "8px !important" }}>
            <CloseIcon />
          </IconButton>
        )}
      </Stack>

      <Box sx={{ width: '100%' }}>
        <RequestWrapper2 result={getEquipmentSessionsResult} render={function (data: any): ReactElement {
          const rows = data.getEquipmentSessionsWithAttachedEntities;

          const columns: GridColDef<(typeof rows)[number]>[] = [
            {
              field: 'id',
              headerName: 'ID',
              width: 90
            },
            {
              field: 'readerSlug',
              headerName: 'ACS',
              width: 120
            },
            {
              field: 'equipment',
              headerName: 'Equipment',
              width: 270,
              valueGetter: (value, row) => (`${row.equipmentName} (${row.equipmentID})`),
              renderCell: (params) => (<AuditLogEntity entityCode={`equipment:${params.row.equipmentID}:${params.row.equipmentName}`} />)
            },
            {
              field: 'user',
              headerName: 'User',
              width: 180,
              valueGetter: (value, row) => (`${row.userName} (${row.userID})`),
              renderCell: (params) => (<AuditLogEntity entityCode={`user:${params.row.userID}:${params.row.userName}`} />),
            },
            {
              field: 'room',
              headerName: 'Room',
              width: 270,
              valueGetter: (value, row) => (`${row.roomName} (${row.roomID})`),
              renderCell: (params) => (<AuditLogEntity entityCode={`room:${params.row.roomID}:${params.row.roomName}`} />),
            },
            {
              field: 'zone',
              headerName: 'Zone',
              width: 160,
              valueGetter: (value, row) => `${row.zoneName} (${row.zoneID})`
            },
            {
              field: 'start',
              headerName: 'Start',
              width: 160,
              valueGetter: (value) => format(new Date(value), "M/d/yy h:mmaaa")
            },
            {
              field: 'sessionLength',
              headerName: 'Session Length',
              width: 180,
              valueGetter: (value) => secondsToHumanString(value)
            },
          ];

          const groupedRows = groupByReaderSlug(rows);

          return (

            <Box>
              <DataGrid
                rows={rows}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 5,
                    },
                  },
                }}
                pageSizeOptions={[5]}
                //checkboxSelection
                disableRowSelectionOnClick
              />

              <Box width={"100%"}>
                <IconButton sx={{ width: "100%", borderRadius: 0 }} onClick={() => setCardContainerCollapsed(!cardContainerCollapsed)}>
                  {cardContainerCollapsed ? "Show Cards" : "Hide Cards"}
                  {cardContainerCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
                <Collapse in={!cardContainerCollapsed}>
                  <Stack direction={"row"} flexWrap={"wrap"} justifyContent={"center"} alignItems={"center"}>
                    {Object.keys(groupedRows).map((key) => (
                      <EquipmentStatCard relevantEquipmentSessions={groupedRows[key]} />
                    ))}
                  </Stack>
                </Collapse>
              </Box>
            </Box>
          )
        }} />
      </Box>
    </Box>
  )
}