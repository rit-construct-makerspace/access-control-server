import { useQuery } from "@apollo/client/react";
import { useParams } from "react-router-dom";
import { Button, Stack, Typography } from "@mui/material";
import { GET_MAKERSPACE_WITH_ITEMS } from "../../../queries/makerspaceQueries";
import { InventoryForMakerspace } from "../../lab_management/inventory/common/InventoryForMakerspace";
import { GET_INVENTORY_TAGS } from "../../../queries/inventoryQueries";
import { useState } from "react";
import InventoryTagsModal from "../../lab_management/inventory/InventoryTagsModal";
import MaterialModal from "../../lab_management/inventory/MaterialModal";
import QuickInventoryQRCodeModal from "./QuickInventoryQRCodeModal";
import QrCodeIcon from '@mui/icons-material/QrCode';
import SellIcon from '@mui/icons-material/Sell';

export default function InventoryPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const makerspaceInventoryResult = useQuery(GET_MAKERSPACE_WITH_ITEMS, {
    variables: { id: Number(makerspaceID) }
  });
  const inventoryTagsResult = useQuery(GET_INVENTORY_TAGS);

  const name: string = makerspaceInventoryResult.data?.makerspaceByID.name ?? "Loading";

  const [modalItemID, setModalItemID] = useState("");
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [qrModal, setQrModal] = useState(false);

  return (
    <Stack spacing={2} sx={{ padding: "15px" }}>
      <title>{`${name} Inventory`}</title>
      <Typography variant="h3">{name} Inventory</Typography>
      <Stack direction={"row"} spacing={2}>
        <Button variant="contained" color="primary" onClick={() => setQrModal(true)} startIcon={<QrCodeIcon />}>Create QR Codes</Button>
        <Button variant="contained" color="secondary" onClick={() => setTagsModalOpen(true)} startIcon={<SellIcon />}>Manage Tags</Button>
      </Stack>
      <InventoryForMakerspace
        searchText=""
        makerspace={makerspaceInventoryResult.data?.makerspaceByID ?? { name: "Loading", items: [] }}
        tags={inventoryTagsResult.data?.inventoryTags ?? []}
        setModalItemId={setModalItemID}
      />

      <QuickInventoryQRCodeModal open={qrModal} onClose={() => setQrModal(false)} />
      <MaterialModal itemId={modalItemID} onClose={() => setModalItemID("")} />
      <InventoryTagsModal tagModalOpen={tagsModalOpen} setTagModalOpen={setTagsModalOpen} />
    </Stack>
  );
}