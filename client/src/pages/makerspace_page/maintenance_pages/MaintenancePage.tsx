import { Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { FullMakerspace, GET_MAKERSPACE_BY_ID } from "../../../queries/makerspaceQueries";
import { useQuery } from "@apollo/client";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { DataGrid, GridRowsProp, GridColDef, GridFilterModel, GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { useState } from "react";

export default function MaintenancePage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const getMakerspace = useQuery(GET_MAKERSPACE_BY_ID, { variables: { id: makerspaceID } });

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 100, });
  const [filterModel, setFilterModel] = useState<GridFilterModel>();
  const [sortModel, setSortModel] = useState<GridSortModel>();

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID" },
    { field: "equipment", headerName: "Equipment" },
    { field: "instance", headerName: "Instance" },
    { field: "type", headerName: "Type" },
    { field: "status", headerName: "Status" },
    { field: "creator", headerName: "Creator" },
    { field: "created", headerName: "Created" }
  ];

  function handlePaginationModelChange(model: GridPaginationModel) {
    setPaginationModel(model);
    console.log(model);
  }

  function handleFilterModelChange(model: GridFilterModel) {
    setFilterModel(model);
    console.log(model);
  }

  function handleSortModelChange(model: GridSortModel) {
    setSortModel(model);
    console.log(model);
  }

  return (
    <RequestWrapper2 result={getMakerspace} render={(data) => {

      const makerspace: FullMakerspace = data.makerspaceByID;

      return (
        <Stack padding={"15px"} spacing={2}>
          <Typography>{`Maintenance Items for ${makerspace.name}`}</Typography>
          <DataGrid
            columns={columns}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            filterMode="server"
            filterModel={filterModel}
            onFilterModelChange={handleFilterModelChange}
            sortingMode="server"
            sortModel={sortModel}
            onSortModelChange={handleSortModelChange}
          />
        </Stack>
      );
    }} />
  );
}