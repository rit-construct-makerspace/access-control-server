import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import SearchBar from "../../../common/SearchBar";
import CreateIcon from "@mui/icons-material/Create";
import { useQuery } from "@apollo/client/react";
import RequestWrapper from "../../../common/RequestWrapper";
import MaterialModal from "./MaterialModal";
import { GET_INVENTORY_TAGS } from "../../../queries/inventoryQueries";
import Ledger from "./Ledger";
import InventoryTagsModal from "./InventoryTagsModal";
import { GET_MAKERSPACES_WITH_ITEMS, MakerspaceWithItems } from "../../../queries/makerspaceQueries";
import { InventoryForMakerspace } from "./common/InventoryForMakerspace";
import { useLocation, useNavigate } from "react-router-dom";
import LowInventory from "./common/LowInventory";
import { useMakeTheme } from "../../../common/MakeThemeProvider";


export default function AdminInventoryPage() {
  const [searchText, setSearchText] = useState<string>("");
  const [modalItemId, setModalItemId] = useState<string>("");
  const [tagsModalOpen, setTagsModalOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  const makeTheme = useMakeTheme();
  const { search } = useLocation();

  const inventoryTagsResult = useQuery(GET_INVENTORY_TAGS);

  const makerspacesWithItemsResult = useQuery(GET_MAKERSPACES_WITH_ITEMS);

  const setUrlParam = (paramName: string, paramValue: string) => {
    const params = new URLSearchParams(search);
    params.set(paramName, paramValue);
    navigate(`/admin/inventory?` + params, { replace: true });
  };
  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const queryString = searchParams.get("a") ?? "";

    setSearchText(queryString)
  }, [search]);

  return (
    <RequestWrapper loading={makerspacesWithItemsResult.loading} error={makerspacesWithItemsResult.error}>
      <Stack width={"auto"}>
        <title>{`Inventory | ${makeTheme.title}`}</title>
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
              onSubmit={() => setUrlParam("a", searchText)}
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
            {/* Running Low Section */}
            <LowInventory
              searchText={searchText}
              tags={inventoryTagsResult.data?.inventoryTags || []}
              setModalItemId={setModalItemId}
            />

            {/* Makerspace Inventories */}
            {makerspacesWithItemsResult.data?.makerspaces.map((space: MakerspaceWithItems) => (
              <InventoryForMakerspace
                key={space.id}
                makerspace={space}
                searchText={searchText}
                tags={inventoryTagsResult.data?.inventoryTags || []}
                setModalItemId={setModalItemId}
              />
            ))}
          </Box>

          <Ledger />

          <MaterialModal itemId={modalItemId} onClose={() => setModalItemId("")} />

          <InventoryTagsModal tagModalOpen={tagsModalOpen} setTagModalOpen={setTagsModalOpen} />
        </Box>
      </Stack>
    </RequestWrapper>
  );
}
