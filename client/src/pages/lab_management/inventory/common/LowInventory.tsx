import { useState } from "react";
import { GET_INVENTORY_ITEMS } from "../../../../queries/inventoryQueries";
import { Box } from "@mui/system";
import PageSectionHeader from "../../../../common/PageSectionHeader";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useQuery } from "@apollo/client";
import { TagsCell } from "./TagsCell";
import { InventoryTag } from "../../../../types/InventoryItem";


interface LowInventoryProps {
  searchText: string;
  tags: InventoryTag[];
  setModalItemId: React.Dispatch<React.SetStateAction<string>>;
}

export default function LowInventory(props: LowInventoryProps) {
  const [windowWidth] = useState<number>(window.innerWidth);

  const inventoryItemsResult = useQuery(GET_INVENTORY_ITEMS);
  const lowInventoryItems = inventoryItemsResult.data?.InventoryItems.filter(
    (item: any) => item.count < item.threshold
  );

  console.log("lowInventoryItems: ", lowInventoryItems);

  const columns: GridColDef<(typeof lowInventoryItems)[number]>[] = [
    {
      field: "makerspace.name",
      headerName: "Makerspace",
      width: 250,
      valueGetter: (value, row) => row.makerspace.name,
    },
    {
      field: "name",
      headerName: "Item",
      minWidth: 400,
      width: windowWidth > 1550 ? windowWidth * 0.425 : windowWidth * 0.2,
      maxWidth: 700,
    },
    {
      field: "tags",
      headerName: "Tags",
      minWidth: 230,
      width: windowWidth > 1550 ? windowWidth * 0.35 : windowWidth * 0.2,
      maxWidth: 500,
      valueGetter: (value, row) => row.tags,
      renderCell: (params) => <TagsCell item={params.row} allTags={props.tags} />,
    },
    {
      field: "count",
      headerName: "Units Available",
      width: 110,
      valueGetter: (value, row) => row.count,
    },
    {
      field: "pricePerUnit",
      headerName: "Price / Unit",
      width: 130,
      valueGetter: (value, row) => `$${row.pricePerUnit.toFixed(2)}`,
    },
  ];

  return (
    <Box>
      <PageSectionHeader>Running Low</PageSectionHeader>
      <Box sx={{ width: "100%", overflowX: "scroll" }}>
        <DataGrid
          rows={lowInventoryItems}
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
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
}
