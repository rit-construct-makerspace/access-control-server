import { useLazyQuery, useQuery } from "@apollo/client";
import { Box, Button, Collapse, FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField, Tooltip } from "@mui/material";
import gql from "graphql-tag";
import { ReactElement, useEffect, useState } from "react";
import PageSectionHeader from "../../../../common/PageSectionHeader";
import RequestWrapper from "../../../../common/RequestWrapper";
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import RequestWrapper2 from "../../../../common/RequestWrapper2";
import AuditLogEntity from "../../audit_logs/AuditLogEntity";
import { format } from "date-fns";
import DownloadIcon from '@mui/icons-material/Download';
import { RoomStatCard } from "./RoomStatCard";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GET_ROOMS from "../../../../queries/roomQueries";
import Room from "../../../../types/Room";

const GET_VERBOSE_ROOM_SWIPES = gql`
query GetRoomSwipesWithAttachedEntities($startDate: String, $endDate: String, $roomIDs: [String]) {
  getRoomSwipesWithAttachedEntities(startDate: $startDate, endDate: $endDate, roomIDs: $roomIDs) {
    id
    dateTime
    roomID
    roomName
    userID
    userName
  }
}
`;

export interface VerboseRoomSwipe {
  id: number;
  dateTime: number;
  roomID: number;
  userID: number;
  roomName: string;
  userName: string;
};


function joinRoomSession(obj: VerboseRoomSwipe) {
  return (obj.id + ', ' + obj.dateTime + ', ' + obj.roomID + ', ' + obj.roomName + ', ' + obj.userID + ', ' + obj.userName);
}


export function RoomStats() {
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
  const [roomIDs, setRoomIDs] = useState<string[]>([]);

  const [showClearButton, setShowClearButton] = useState<boolean>(false);
  const [cardContainerCollapsed, setCardContainerCollapsed] = useState<boolean>(true);

  const [getRoomSwipes, getRoomSwipesResult] = useLazyQuery(GET_VERBOSE_ROOM_SWIPES);

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setStartDate(e.target.value)
    if (startDate && startDate != "") setShowClearButton(true);
  }

  function handleEndDateChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEndDate(e.target.value)
    if (endDate && endDate != "") setShowClearButton(true);
  }

  function handleRoomIDsChange(e: SelectChangeEvent<string[]>) {
    setRoomIDs(e.target.value as string[])
    if (roomIDs && roomIDs.length > 0) setShowClearButton(true);
  }

  function handleClear() {
    setStartDate("");
    setEndDate("");
    setRoomIDs([]);
    setShowClearButton(false);
  }

  function handleSubmit() {
    var variables = {
      ...(startDate && startDate != "" && { startDate }),
      ...(endDate && endDate != "" && { endDate }),
      ...(roomIDs && roomIDs.length > 0 && { roomIDs: roomIDs })
    };
    getRoomSwipes({ variables });
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
      Object.keys(getRoomSwipesResult.data.getRoomSwipesWithAttachedEntities[0] as VerboseRoomSwipe).map((s: string) => s == "__typename" ? '' : `${s},`).join('')
      + '\n' + getRoomSwipesResult.data.getRoomSwipesWithAttachedEntities.map((e: VerboseRoomSwipe) => joinRoomSession(e)).join("\n");
    download(csvContent, "roomSwipes.csv");
  }

  function groupByRoom(sessions: VerboseRoomSwipe[]): Record<string, VerboseRoomSwipe[]> {
    return sessions.reduce((acc, swipeRow) => {
      if (!acc[swipeRow.roomID]) {
        acc[swipeRow.roomID] = [];
      }
      acc[swipeRow.roomID].push(swipeRow);
      return acc;
    }, {} as Record<string, VerboseRoomSwipe[]>);
  };






  //Dropdown query
  const getRooms = useQuery(GET_ROOMS);

  return (
    <Box width={"100%"}>
      <PageSectionHeader>Room Swipes</PageSectionHeader>

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


        <RequestWrapper loading={getRooms.loading} error={getRooms.error}>
          <FormControl sx={{ width: '25em' }}>
            <InputLabel id="es-stat_room-select_label">Rooms (Default is all)</InputLabel>
            <Select
              labelId="es-stat_room-select_label"
              value={roomIDs}
              label="Rooms"
              multiple
              onChange={handleRoomIDsChange}
            >
              {getRooms.data?.rooms.map((room: Room) => (
                <MenuItem value={room.id}>{room.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </RequestWrapper>

        <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ width: '10em' }}>Fetch</Button>

        <Tooltip title={getRoomSwipesResult.data ? "User, Room, and Zone columns will be split into Names and IDs" : "Must Fetch data before exporting"}>
          <Button onClick={handleCSVExport} startIcon={<DownloadIcon />} variant="outlined" color="secondary" sx={{ width: '10em' }} disabled={!getRoomSwipesResult.data}>Export as CSV</Button>
        </Tooltip>

        {showClearButton && (
          <IconButton onClick={handleClear} sx={{ ml: "8px !important" }}>
            <CloseIcon />
          </IconButton>
        )}
      </Stack>

      <Box sx={{ width: '100%' }}>
        <RequestWrapper2 result={getRoomSwipesResult} render={function (data: any): ReactElement {
          const rows = data.getRoomSwipesWithAttachedEntities;

          const columns: GridColDef<(typeof rows)[number]>[] = [
            {
              field: 'id',
              headerName: 'ID',
              width: 90
            },
            {
              field: 'room',
              headerName: 'Room',
              width: 270,
              valueGetter: (value, row) => (`${row.roomName} (${row.roomID})`),
              renderCell: (params) => (<AuditLogEntity entityCode={`room:${params.row.roomID}:${params.row.roomName}`} />),
            },
            {
              field: 'dateTime',
              headerName: 'Timestamp',
              width: 160,
              valueGetter: (value) => format(new Date(value), "M/d/yy h:mmaaa")
            },
            {
              field: 'user',
              headerName: 'User',
              width: 180,
              valueGetter: (value, row) => (`${row.userName} (${row.userID})`),
              renderCell: (params) => (<AuditLogEntity entityCode={`user:${params.row.userID}:${params.row.userName}`} />),
            },
          ];

          const groupedRows = groupByRoom(rows);

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
                      <RoomStatCard relevantRoomSwipes={groupedRows[key]} />
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