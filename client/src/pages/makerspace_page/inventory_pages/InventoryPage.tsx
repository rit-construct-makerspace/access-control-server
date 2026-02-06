import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { Stack, Typography } from "@mui/material";
import { GET_MAKERSPACE_WITH_ITEMS } from "../../../queries/makerspaceQueries";
import InventoryItem from "../../../types/InventoryItem";
import { InventoryForMakerspace } from "../../lab_management/inventory/common/InventoryForMakerspace";
import { GET_INVENTORY_TAGS } from "../../../queries/inventoryQueries";
import { useState } from "react";

export default function InventoryPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const makerspaceInventoryResult = useQuery(GET_MAKERSPACE_WITH_ITEMS, {
    variables: { id: Number(makerspaceID) }
  });
  const inventoryTagsResult = useQuery(GET_INVENTORY_TAGS);

  const name: string = makerspaceInventoryResult.data?.makerspaceByID.name ?? "Loading";
  const items: InventoryItem[] = makerspaceInventoryResult.data?.makerspaceByID.items ?? [];

  const [modalItemID, setModalItemId] = useState("");

  return (
    <Stack spacing={2} sx={{ padding: "15px" }}>
      <Typography variant="h3">{name} Inventory</Typography>
      <InventoryForMakerspace
        searchText=""
        makerspace={makerspaceInventoryResult.data?.makerspaceByID ?? { name: "Loading", items: [] }}
        tags={inventoryTagsResult.data?.inventoryTags ?? []}
        setModalItemId={setModalItemId}
      />
    </Stack>
  );
}