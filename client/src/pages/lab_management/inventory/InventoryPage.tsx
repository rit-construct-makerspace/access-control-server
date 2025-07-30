import React, { useState } from "react";
import Page from "../../Page";
import { Box, Button, Divider, IconButton, Stack, Switch, Table, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import SearchBar from "../../../common/SearchBar";
import PageSectionHeader from "../../../common/PageSectionHeader";
import { useNavigate, useParams } from "react-router-dom";
import InventoryRow from "../../../common/InventoryRow";
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
import { format } from "date-fns";
import { isManager } from "../../../common/PrivilegeUtils";
import { secondsToHumanString } from "../statistics/StatisticsFunctions";
import { StaffOnlyToggle } from "./common/StaffOnlyToggle";
import { StorefrontVisibleToggle } from "./common/StorefrontVisibleToggle";
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { FullZone, GET_ZONES, GET_ZONES_WITH_ITEMS, ZoneWithItems } from "../../../queries/zoneQueries";
import { InventoryForMakerspace } from "./common/InventoryForMakerspace";


function sortItemsByName(items: InventoryItem[]): InventoryItem[] {
  return [...items].sort((a, b) => (a.name > b.name ? 1 : -1)) ?? [];
}

export default function InventoryPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  function handleWindowSizeChange() {
      setWindowWidth(window.innerWidth);
  }

  const [searchText, setSearchText] = useState<string>("");
  const [modalItemId, setModalItemId] = useState<string>("");
  const [tagsModalOpen, setTagsModalOpen] = useState<boolean>(false);

  const inventoryTagsResult = useQuery(GET_INVENTORY_TAGS);

  const zonesWithItemsResult = useQuery(GET_ZONES_WITH_ITEMS);


  return (
    <RequestWrapper loading={zonesWithItemsResult.loading} error={zonesWithItemsResult.error}>
      <AdminPage>
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
            {zonesWithItemsResult.data?.zones.map((zone: ZoneWithItems) => (
              <InventoryForMakerspace key={zone.id} makerspace={zone} searchText={searchText} tags={inventoryTagsResult.data?.inventoryTags || []} setModalItemId={setModalItemId} />
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
