import { useState, useEffect } from "react";
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
	const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
	useEffect(() => {
		const onResize = () => setWindowWidth(window.innerWidth);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	const inventoryItemsResult = useQuery(GET_INVENTORY_ITEMS);
	const lowInventoryItems = inventoryItemsResult.data?.InventoryItems.filter(
		(item: any) => item.count < item.threshold
	);

	console.log("lowInventoryItems: ", lowInventoryItems);

	const columns: GridColDef<(typeof lowInventoryItems)[number]>[] = [
		{
			field: "makerspace.name",
			headerName: "Makerspace",
			minWidth: 200,
			flex: 1,
			valueGetter: (value, row) => row.makerspace.name,
		},
		{
			field: "name",
			headerName: "Item",
			minWidth: 240,
			flex: 2.5,
		},
		{
			field: "tags",
			headerName: "Tags",
			minWidth: 160,
			flex: 1.5,
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
			field: "threshold",
			headerName: "Minimum Needed",
			width: 140,
			valueGetter: (value, row) => row.threshold,
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
