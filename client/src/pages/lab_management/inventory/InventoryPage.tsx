import { useState } from "react";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import SearchBar from "../../../common/SearchBar";
import PageSectionHeader from "../../../common/PageSectionHeader";
import CreateIcon from "@mui/icons-material/Create";
import { useQuery } from "@apollo/client";
import InventoryItem from "../../../types/InventoryItem";
import RequestWrapper from "../../../common/RequestWrapper";
import MaterialModal from "./MaterialModal";
import { GET_INVENTORY_ITEMS, GET_INVENTORY_TAGS } from "../../../queries/inventoryQueries";
import AdminPage from "../../AdminPage";
import Ledger from "./Ledger";
import InventoryTagsModal from "./InventoryTagsModal";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { TagsCell } from "./common/TagsCell";
import { isManager } from "../../../common/PrivilegeUtils";
import { StaffOnlyToggle } from "./common/StaffOnlyToggle";
import { StorefrontVisibleToggle } from "./common/StorefrontVisibleToggle";
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import { useCurrentUser } from "../../../common/CurrentUserProvider";


function sortItemsByName(items: InventoryItem[]): InventoryItem[] {
  return [...items].sort((a, b) => (a.name > b.name ? 1 : -1)) ?? [];
}

export default function InventoryPage() {
  const currentUser = useCurrentUser();

  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  const [searchText, setSearchText] = useState<string>("");
  const [modalItemId, setModalItemId] = useState<string>("");
  const [tagsModalOpen, setTagsModalOpen] = useState<boolean>(false);

  const inventoryTagsResult = useQuery(GET_INVENTORY_TAGS);

  const { loading, error, data } = useQuery(GET_INVENTORY_ITEMS);

  const safeData = data?.InventoryItems ?? [];
  const sortedItems = sortItemsByName(safeData);
  const lowItems = sortedItems.filter((i: any) => i.count < i.threshold);
  const matchingItems = sortedItems.filter((i: any) => i.name.toLowerCase().includes(searchText.toLowerCase()));

  const columns: GridColDef<(typeof matchingItems)[number]>[] = [
    {
      field: 'name',
      headerName: 'Item',
      minWidth: 400,
      width: windowWidth > 1550 ? windowWidth*0.425 : windowWidth*0.2,
      maxWidth: 700
    },
    {
      field: 'tags',
      headerName: 'Tags',
      minWidth: 230,
      width: windowWidth > 1550 ? windowWidth*0.35 : windowWidth*0.2,
      maxWidth: 500,
      valueGetter: (value, row) => (row.tags),
      renderCell: (params) => (<TagsCell item={params.row} allTags={inventoryTagsResult.data?.inventoryTags ?? []} />)
    },
    {
      field: 'count',
      headerName: 'Units Available',
      width: 110,
      valueGetter: (value, row) => (row.count),
    },
    {
      field: 'pricePerUnit',
      headerName: 'Price / Unit',
      width: 130,
      valueGetter: (value, row) => (`$${row.pricePerUnit.toFixed(2)}`),
    },
    {
      field: 'staffOnly',
      headerName: 'Staff Only',
      width: 160,
      renderCell: (params) => (<StaffOnlyToggle item={params.row} />)
    },
    {
      field: 'storefrontVisible',
      headerName: 'Available on Storefront',
      width: 170,
      renderCell: (params) => (<StorefrontVisibleToggle item={params.row} />)
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90,
      renderCell: (params) => (<IconButton onClick={() => setModalItemId(params.row.id + "")} disabled={params.row.staffOnly && !isManager(currentUser)} defaultChecked={params.row.storefrontVisible}><ModeEditIcon /></IconButton>)
    },
  ];

  return (
    <RequestWrapper loading={loading} error={error}>
      <AdminPage>
        <Box margin="25px">
          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Typography variant="h4">Inventory</Typography>
            <Button variant="outlined" onClick={() => setTagsModalOpen(true)}>Manage Tags</Button>
          </Stack>

          <PageSectionHeader top>Running Low</PageSectionHeader>

          <Box sx={{ width: "100%", overflowX: "scroll" }}>
            <DataGrid
              rows={lowItems}
              columns={columns}
              rowHeight={70}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                  },
                },
              }}
              pageSizeOptions={[10]}
              //checkboxSelection
              disableRowSelectionOnClick
            />
          </Box>

          <PageSectionHeader>All Materials</PageSectionHeader>

          <Stack direction="row" alignItems="center" spacing={1}>
            <SearchBar
              placeholder="Search inventory"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onClear={() => setSearchText("")}
            />
            <Button
              variant="outlined"
              startIcon={<CreateIcon />}
              onClick={() => setModalItemId("new")}
              sx={{ height: 40 }}
            >
              New material
            </Button>
          </Stack>

          <Box sx={{ width: "100%", overflowX: "scroll" }}>
            <DataGrid
              rows={matchingItems}
              columns={columns}
              rowHeight={70}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 50,
                  },
                },
              }}
              pageSizeOptions={[50]}
              //checkboxSelection
              disableRowSelectionOnClick
            />
          </Box>

          <Ledger></Ledger>

          <MaterialModal
            itemId={modalItemId}
            onClose={() => setModalItemId("")}
          />

          <InventoryTagsModal tagModalOpen={tagsModalOpen} setTagModalOpen={setTagsModalOpen} />
        </Box>
      </AdminPage>
    </RequestWrapper>
  );
}
