import { IconButton } from "@mui/material";
import { Box } from "@mui/system";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { isManager } from "../../../../common/PrivilegeUtils";
import { StaffOnlyToggle } from "./StaffOnlyToggle";
import { StorefrontVisibleToggle } from "./StorefrontVisibleToggle";
import { TagsCell } from "./TagsCell";
import { MakerspaceWithItems } from "../../../../queries/makerspaceQueries";
import InventoryItem, { InventoryTag } from "../../../../types/InventoryItem";
import { useCurrentUser } from "../../../../common/CurrentUserProvider";
import ModeEditIcon from '@mui/icons-material/ModeEdit';

function sortItemsByName(items: InventoryItem[]): InventoryItem[] {
  return [...items].sort((a, b) => (a.name > b.name ? 1 : -1)) ?? [];
}

interface InventoryForMakerspaceProps {
  searchText: string;
  makerspace: MakerspaceWithItems;
  tags: InventoryTag[];
  setModalItemId: React.Dispatch<React.SetStateAction<string>>;
}

export function InventoryForMakerspace(props: InventoryForMakerspaceProps) {
  const currentUser = useCurrentUser();

  const safeData = props.makerspace.items ?? [];
  const sortedItems = sortItemsByName(safeData);
  const matchingItems = sortedItems.filter((i: any) => i.name.toLowerCase().includes(props.searchText.toLowerCase()));

  const columns: GridColDef<(typeof matchingItems)[number]>[] = [
    {
      field: "name",
      headerName: "Item",
      minWidth: 240,
      flex: 2.5,
    },
    {
      field: "tags",
      headerName: "Tags",
      minWidth: 180,
      flex: 1.5,
      valueGetter: (value, row) => row.tags,
      renderCell: (params) => <TagsCell item={params.row} allTags={props.tags} />,
    },
    {
      field: 'count',
      headerName: 'Units Available',
      width: 110,
      valueGetter: (value, row) => (row.count),
    },
    {
      field: 'pricePerUnit',
      headerName: "Price / Unit",
      width: 130,
      valueGetter: (value, row) => `$${row.pricePerUnit.toFixed(2)}`,
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
    <Box sx={{ width: "100%" }}>
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
        disableColumnResize
      />
    </Box>
  )
}