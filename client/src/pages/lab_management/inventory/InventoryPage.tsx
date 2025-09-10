import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import SearchBar from "../../../common/SearchBar";
import CreateIcon from "@mui/icons-material/Create";
import { useQuery } from "@apollo/client";
import RequestWrapper from "../../../common/RequestWrapper";
import MaterialModal from "./MaterialModal";
import { GET_INVENTORY_TAGS } from "../../../queries/inventoryQueries";
import AdminPage from "../../AdminPage";
import Ledger from "./Ledger";
import InventoryTagsModal from "./InventoryTagsModal";
import { GET_MAKERSPACES_WITH_ITEMS, MakerspaceWithItems } from "../../../queries/makerspaceQueries";
import { InventoryForMakerspace } from "./common/InventoryForMakerspace";



export default function InventoryPage() {
  const [searchText, setSearchText] = useState<string>("");
  const [modalItemId, setModalItemId] = useState<string>("");
  const [tagsModalOpen, setTagsModalOpen] = useState<boolean>(false);

  const inventoryTagsResult = useQuery(GET_INVENTORY_TAGS);

  const makerspacesWithItemsResult = useQuery(GET_MAKERSPACES_WITH_ITEMS);

  return (
    <RequestWrapper loading={makerspacesWithItemsResult.loading} error={makerspacesWithItemsResult.error}>
      <AdminPage>
        <title>Inventory | Make @ RIT</title>
        <Box margin="25px">
          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Typography variant="h4">Inventory</Typography>
            <Button variant="outlined" onClick={() => setTagsModalOpen(true)}>Manage Tags</Button>
          </Stack>

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
            {makerspacesWithItemsResult.data?.makerspaces.map((space: MakerspaceWithItems) => (
              <InventoryForMakerspace key={space.id} makerspace={space} searchText={searchText} tags={inventoryTagsResult.data?.inventoryTags || []} setModalItemId={setModalItemId} />
            ))}
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
