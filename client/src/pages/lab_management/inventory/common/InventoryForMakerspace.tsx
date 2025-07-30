import { IconButton } from "@mui/material";
import { Box } from "@mui/system";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useState } from "react";
import { isManager } from "../../../../common/PrivilegeUtils";
import { StaffOnlyToggle } from "./StaffOnlyToggle";
import { StorefrontVisibleToggle } from "./StorefrontVisibleToggle";
import { TagsCell } from "./TagsCell";
import { ZoneWithItems } from "../../../../queries/zoneQueries";
import InventoryItem, { InventoryTag } from "../../../../types/InventoryItem";
import { useCurrentUser } from "../../../../common/CurrentUserProvider";
import ModeEditIcon from '@mui/icons-material/ModeEdit';

function sortItemsByName(items: InventoryItem[]): InventoryItem[] {
  return [...items].sort((a, b) => (a.name > b.name ? 1 : -1)) ?? [];
}

interface InventoryForMakerspaceProps {
  searchText: string;
  makerspace: ZoneWithItems;
  tags: InventoryTag[];
  setModalItemId: React.Dispatch<React.SetStateAction<string>>;
}

export function InventoryForMakerspace(props: InventoryForMakerspaceProps) {
  const currentUser = useCurrentUser();
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  function handleWindowSizeChange() {
    setWindowWidth(window.innerWidth);
  }

  const safeData = props.makerspace.items ?? [];
  const sortedItems = sortItemsByName(safeData);
  const lowItems = sortedItems.filter((i: any) => i.count < i.threshold);
  const matchingItems = sortedItems.filter((i: any) => i.name.toLowerCase().includes(props.searchText.toLowerCase()));

  const columns: GridColDef<(typeof matchingItems)[number]>[] = [
    {
      field: 'name',
      headerName: 'Item',
      minWidth: 400,
      width: windowWidth > 1550 ? windowWidth * 0.425 : windowWidth * 0.2,
      maxWidth: 700
    },
    {
      field: 'tags',
      headerName: 'Tags',
      minWidth: 230,
      width: windowWidth > 1550 ? windowWidth * 0.35 : windowWidth * 0.2,
      maxWidth: 500,
      valueGetter: (value, row) => (row.tags),
      renderCell: (params) => (<TagsCell item={params.row} allTags={props.tags} />)
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
      renderCell: (params) => (<IconButton onClick={() => props.setModalItemId(params.row.id + "")} disabled={params.row.staffOnly && !isManager(currentUser)} defaultChecked={params.row.storefrontVisible}><ModeEditIcon /></IconButton>)
    },
  ];

  return (
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
  )
}