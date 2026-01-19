import { Button, Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { FullMakerspace, GET_MAKERSPACE_BY_ID } from "../../../queries/makerspaceQueries";
import { useQuery } from "@apollo/client";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { DataGrid, GridRowsProp, GridColDef, GridFilterModel, GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { useState } from "react";
import { MaintenanceTicket, MaintenanceTicketType, PAGINATED_MAINTENANCE_TICKETS } from "../../../queries/maintenanceTicketQueries";
import NewTicketModal from "./NewTicketModal";
import WarningIcon from '@mui/icons-material/Warning';

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
      } : undefined
    }
  });

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 10, filterable: false },
    { field: "equipment", headerName: "Equipment", width: 350, sortable: false },
    { field: "instance", headerName: "Instance", width: 300, sortable: false },
    { field: "type", headerName: "Type", width: 110, sortable: false },
    { field: "status", headerName: "Status", width: 140 },
    { field: "severity", headerName: "Severity", width: 140 },
    { field: "creator", headerName: "Creator", width: 100, sortable: false },
    { field: "dateCreated", headerName: "Created", width: 180, filterable: false }
  ];

  function handlePaginationModelChange(model: GridPaginationModel) {
    setPaginationModel(model);
    getMaintenanceTickets.refetch();
  }

  function handleFilterModelChange(model: GridFilterModel) {
    setFilterModel(model);
  }

  function handleSortModelChange(model: GridSortModel) {
    setSortModel(model);
    getMaintenanceTickets.refetch();
  }

  return (
    <RequestWrapper2 result={getMakerspace} render={(data) => {

      const makerspace: FullMakerspace = data.makerspaceByID;

      return (
        <RequestWrapper2 result={getMaintenanceTickets} render={(data) => {

          const tickets: MaintenanceTicket[] = data.paginatedMaintenanceTickets;

          const rows: GridRowsProp = tickets.map((ticket) => (
            {
              id: ticket.id,
              equipment: ticket.instance.equipment.name,
              instance: ticket.instance.name,
              type: ticket.type,
              status: ticket.status,
              severity: ticket.severity,
              creator: ticket.type === MaintenanceTicketType.AUTOMATIC ? "SERVER" : ticket.creator?.ritUsername ?? "",
              dateCreated: formatter.format(new Date(Number(ticket.dateCreated)))
            }
          ))

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
    }} />
  );
}