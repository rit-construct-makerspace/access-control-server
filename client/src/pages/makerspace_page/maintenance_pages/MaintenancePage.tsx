import { Button, Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { FullMakerspace, GET_MAKERSPACE_BY_ID } from "../../../queries/makerspaceQueries";
import { useQuery } from "@apollo/client";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { DataGrid, GridRowsProp, GridColDef, GridFilterModel, GridPaginationModel, GridSortModel, getGridStringOperators, GridRenderCellParams } from "@mui/x-data-grid";
import { useState } from "react";
import { MaintenanceTicket, MaintenanceTicketType, PAGINATED_MAINTENANCE_TICKETS } from "../../../queries/maintenanceTicketQueries";
import NewTicketModal from "./NewTicketModal";
import WarningIcon from '@mui/icons-material/Warning';
import MaintenanceTicketModal from "./MaintenanceTicketModal";
import { useDebounce } from "../../../common/useDebounce";

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

  const getMakerspace = useQuery(GET_MAKERSPACE_BY_ID, { variables: { id: makerspaceID } });

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 100, });
  const [filterModel, setFilterModel] = useState<GridFilterModel>();
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  const debouncedFilter = useDebounce(filterModel, 300);

  const [newTicketModal, setNewTicketModal] = useState(false);

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
      filter: (debouncedFilter && debouncedFilter.items.length > 0) ? {
        target: debouncedFilter.items[0].field,
        op: debouncedFilter.items[0].operator,
        value: debouncedFilter.items[0].value ?? ""
      } : undefined,
      makerspaceID: Number(makerspaceID)
    }
  });

  const containsOperator = getGridStringOperators().filter((operator) => operator.value === "contains");

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 10, filterable: false },
    { field: "equipment", headerName: "Equipment", width: 350, sortable: false, filterOperators: containsOperator },
    { field: "instance", headerName: "Instance", width: 300, sortable: false, filterOperators: containsOperator },
    { field: "type", headerName: "Type", width: 140, sortable: false, filterOperators: containsOperator },
    { field: "status", headerName: "Status", width: 140, filterOperators: containsOperator },
    { field: "severity", headerName: "Severity", width: 140, filterOperators: containsOperator },
    { field: "creator", headerName: "Creator", width: 140, sortable: false, filterOperators: containsOperator },
    { field: "assigned", headerName: "Assigned", width: 140, sortable: false, filterOperators: containsOperator },
    { field: "dateCreated", headerName: "Created", width: 180, filterable: false },
    {
      field: "manage", headerName: "Manage", width: 140, filterable: false, sortable: false, renderCell: (params: GridRenderCellParams<any, MaintenanceTicket>) => {
        const [open, setOpen] = useState(false);

        if (!params.value) {
          return;
        }

        return (
          <Stack height={"100%"} justifyContent={"center"}>
            <Button
              color="info"
              variant="contained"
              onClick={() => setOpen(true)}
            >
              View Ticket
            </Button>
            <MaintenanceTicketModal ticket={params.value} open={open} onClose={() => setOpen(false)} />
          </Stack>
        );
      }
    }
  ];

  function handlePaginationModelChange(model: GridPaginationModel) {
    setPaginationModel(model);
  }

  function handleFilterModelChange(model: GridFilterModel) {
    setFilterModel(model);
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
          <DataGrid
            columns={columns}
            rows={rows}
            loading={getMaintenanceTickets.loading}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            filterMode="server"
            filterModel={filterModel}
            onFilterModelChange={handleFilterModelChange}
            sortingMode="server"
            sortModel={sortModel}
            onSortModelChange={handleSortModelChange}
            rowCount={-1}
          />
          <NewTicketModal open={newTicketModal} onClose={() => setNewTicketModal(false)} makerspace={makerspace} />
        </Stack>
      );
    }} />
  );
}