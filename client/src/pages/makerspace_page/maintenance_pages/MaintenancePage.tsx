import { Autocomplete, Button, Stack, TextField, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { FullMakerspace, GET_MAKERSPACE_BY_ID } from "../../../queries/makerspaceQueries";
import { useQuery } from "@apollo/client/react";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { DataGrid, GridRowsProp, GridColDef, GridPaginationModel, GridSortModel, GridRenderCellParams } from "@mui/x-data-grid";
import { useState } from "react";
import { MaintenanceTicket, MaintenanceTicketSeverity, MaintenanceTicketStatus, MaintenanceTicketType, PAGINATED_MAINTENANCE_TICKETS } from "../../../queries/maintenanceTicketQueries";
import NewTicketModal from "./NewTicketModal";
import WarningIcon from '@mui/icons-material/Warning';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import NewIntervalTicketModal from "./NewIntervalTicketModal";
import { isManager } from "../../../common/PrivilegeUtils";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import Equipment from "../../../types/Equipment";
import MaintenanceTicketButtonCell from "./MaintenanceTicketButtonCell";

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

export default function MaintenancePage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const user = useCurrentUser();

  const getMakerspace = useQuery(GET_MAKERSPACE_BY_ID, { variables: { id: makerspaceID } });

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 100, });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [newTicketModal, setNewTicketModal] = useState(false);
  const [timeTicketModal, setTimeTicketModal] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState<Equipment[]>([]);
  const [statusFilter, setStatusFilter] = useState<MaintenanceTicketStatus[]>([MaintenanceTicketStatus.TODO, MaintenanceTicketStatus.IN_PROGRESS]);
  const [severityFilter, setSeverityFilter] = useState<MaintenanceTicketSeverity[]>([]);

  const getMaintenanceTickets = useQuery(PAGINATED_MAINTENANCE_TICKETS, {
    variables: {
      pagination: {
        page: paginationModel.page,
        pageSize: paginationModel.pageSize
      },
      sort: sortModel.length > 0 ? {
        target: sortModel[0].field,
        dir: sortModel[0].sort
      } : undefined,
      filter: {
        equipment: equipmentFilter.map((equipment) => (Number(equipment.id))),
        status: statusFilter,
        severity: severityFilter
      },
      makerspaceID: Number(makerspaceID)
    }
  });

  // const containsOperator = getGridStringOperators().filter((operator) => operator.value === "contains");

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 10, filterable: false, resizable: false, hideable: false },
    { field: "equipment", headerName: "Equipment", width: 350, sortable: false, filterable: false, resizable: false },
    { field: "instance", headerName: "Instance", width: 300, sortable: false, filterable: false, resizable: false },
    { field: "type", headerName: "Type", width: 140, sortable: false, filterable: false, resizable: false },
    { field: "status", headerName: "Status", width: 140, filterable: false, resizable: false },
    { field: "severity", headerName: "Severity", width: 140, filterable: false, resizable: false },
    { field: "creator", headerName: "Creator", width: 140, sortable: false, filterable: false, resizable: false },
    { field: "assigned", headerName: "Assigned", width: 140, sortable: false, filterable: false, resizable: false },
    { field: "dateCreated", headerName: "Created", width: 180, filterable: false, resizable: false },
    {
      field: "manage", headerName: "Manage", width: 140, filterable: false, sortable: false, renderCell: (params: GridRenderCellParams<any, MaintenanceTicket>) => (
        <MaintenanceTicketButtonCell ticket={params.value} />
      )
    }
  ];

  function handlePaginationModelChange(model: GridPaginationModel) {
    setPaginationModel(model);
  }

  function handleSortModelChange(model: GridSortModel) {
    setSortModel(model);
  }

  const tickets: MaintenanceTicket[] = getMaintenanceTickets.data?.paginatedMaintenanceTickets ?? [];

  const rows: GridRowsProp = tickets.map((ticket) => (
    {
      id: ticket.id,
      equipment: ticket.instance.equipment.name,
      instance: ticket.instance.name,
      type: ticket.type,
      status: ticket.status,
      severity: ticket.severity,
      creator: ticket.type === MaintenanceTicketType.REPORTED ? ticket.creator?.ritUsername ?? "" : "SERVER",
      assigned: ticket.assigned?.ritUsername ?? "UNASSIGNED",
      dateCreated: formatter.format(new Date(Number(ticket.dateCreated))),
      manage: ticket
    }
  ))

  return (
    <RequestWrapper2 result={getMakerspace} render={(data) => {

      const makerspace: FullMakerspace = data.makerspaceByID;

      const bumpy_equipment = makerspace.rooms.map((room) => (room.equipment));
      const makerspace_equipment = bumpy_equipment.flat(1);

      return (
        <Stack padding={"15px"} spacing={2}>
          <title>{`${makerspace.name} Maintenance`}</title>
          <Stack direction={"row"} justifyContent={"space-between"}>
            <Typography variant="h4">{`Maintenance Items for ${makerspace.name}`}</Typography>
            <Button
              color="primary"
              variant="contained"
              onClick={() => setNewTicketModal(true)}
              startIcon={<WarningIcon />}
            >
              Report Issue
            </Button>
          </Stack>
          <Stack direction={"row"} spacing={2}>
            <Button
              color="secondary"
              variant="contained"
              startIcon={<WatchLaterIcon />}
              onClick={() => setTimeTicketModal(true)}
              disabled={!isManager(user)}
            >
              Create Time Ticket
            </Button>
          </Stack>
          <Stack
            direction={"row"}
            spacing={2}
          >
            <Autocomplete
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Equipment"
                  placeholder="Select Equipment..."
                />
              )}
              options={makerspace_equipment}
              getOptionLabel={(equipment) => (equipment.name)}
              multiple
              value={equipmentFilter}
              onChange={(e, newValue) => setEquipmentFilter(newValue)}
              limitTags={1}
              sx={{
                width: "400px"
              }}
            />
            <Autocomplete
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Status"
                  placeholder="Select Status..."
                />
              )}
              options={[MaintenanceTicketStatus.UPCOMING, MaintenanceTicketStatus.TODO, MaintenanceTicketStatus.IN_PROGRESS, MaintenanceTicketStatus.CLOSED]}
              multiple
              value={statusFilter}
              onChange={(e, newValue) => setStatusFilter(newValue)}
              limitTags={1}
              sx={{
                width: "250px"
              }}
            />
            <Autocomplete
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Severity"
                  placeholder="Select Severity..."
                />
              )}
              options={[MaintenanceTicketSeverity.HIGH, MaintenanceTicketSeverity.MEDIUM, MaintenanceTicketSeverity.LOW]}
              multiple
              value={severityFilter}
              onChange={(e, newValue) => setSeverityFilter(newValue)}
              limitTags={1}
              sx={{
                width: "250px"
              }}
            />
          </Stack>
          <DataGrid
            columns={columns}
            rows={rows}
            loading={getMaintenanceTickets.loading}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            filterMode="server"
            sortingMode="server"
            sortModel={sortModel}
            onSortModelChange={handleSortModelChange}
            rowCount={-1}
          />
          <NewTicketModal open={newTicketModal} onClose={() => setNewTicketModal(false)} makerspace={makerspace} />
          <NewIntervalTicketModal open={timeTicketModal} onClose={() => setTimeTicketModal(false)} makerspace={makerspace} />
        </Stack>
      );
    }} />
  );
}