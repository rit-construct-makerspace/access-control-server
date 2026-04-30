import { Autocomplete, Box, Button, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import PrettyModal from "../../../common/PrettyModal";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { GET_MAKERSPACE_WITH_ITEMS } from "../../../queries/makerspaceQueries";
import { GET_INVENTORY_TAGS } from "../../../queries/inventoryQueries";
import { useEffect, useMemo, useRef, useState } from "react";
import InventoryItem, { InventoryTag } from "../../../types/InventoryItem";
import QRCode from "react-qr-code";
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

interface QuickInventoryQRCodeModalProps {
  open: boolean,
  onClose: () => void
}

export default function QuickInventoryQRCodeModal(props: QuickInventoryQRCodeModalProps) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const makerspaceItemsResult = useQuery(GET_MAKERSPACE_WITH_ITEMS, { variables: { id: makerspaceID } });
  const tagsResult = useQuery(GET_INVENTORY_TAGS);

  const items: InventoryItem[] = useMemo(() => {
    if (makerspaceItemsResult.data?.makerspaceByID === undefined) {
      return [];
    } else {
      return makerspaceItemsResult.data.makerspaceByID.items;
    }
  }, [makerspaceItemsResult.data]);

  const tags: InventoryTag[] = useMemo(() => {
    if (tagsResult.data?.inventoryTags === undefined) {
      return [];
    } else {
      return tagsResult.data.inventoryTags;
    }
  }, [tagsResult.data]);

  const [mode, setMode] = useState<"tag" | "item">();
  const [target, setTarget] = useState<InventoryItem | InventoryTag>();

  useEffect(() => setTarget(undefined), [mode]);

  const svgRef = useRef(null);

  function copyQRCode() {
    const svg = svgRef.current;
    if (svg === null) { return; }
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Set canvas dimensions to match SVG
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx === null) { return; }
      ctx.drawImage(img, 0, 0);

      // Copy to clipboard as a PNG
      canvas.toBlob((blob) => {
        if (blob === null) { return; }
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]);
      });

      URL.revokeObjectURL(url);
    };

    img.src = url;
  }

  return (
    <PrettyModal open={props.open} onClose={props.onClose} width={"500px"}>
      <Stack spacing={2} width={"100%"} alignItems={"center"}>
        <Typography variant="h5">Quick Inventory QR Codes</Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_e, newValue) => setMode(newValue)}
          color="primary"
          fullWidth
        >
          <ToggleButton
            value="tag"
          >
            Tag
          </ToggleButton>
          <ToggleButton
            value="item"
          >
            Item
          </ToggleButton>
        </ToggleButtonGroup>
        <Autocomplete
          key={target?.id ?? -1}
          renderInput={(params) => (
            <TextField
              {...params}
            />
          )}
          value={target}
          options={mode === "item" ? items : tags}
          disabled={mode === undefined || mode === null}
          onChange={(_e, newValue) => setTarget(newValue ?? undefined)}
          // @ts-expect-error If it doesn't exist on one, then the other must exist
          getOptionLabel={(option) => option.label ?? option.name}
          fullWidth
        />
        {
          target
            ? <Box padding={"15px"} sx={{ backgroundColor: "white" }}>
              <QRCode
                value={`${import.meta.env.VITE_ORIGIN}/app/makerspace/${makerspaceID}/inventory/quick/${mode}/${target.id}`}
                ref={svgRef}
              />
            </Box>
            : null
        }
        {
          target
            ? <Button
              color="primary"
              variant="contained"
              fullWidth
              startIcon={<ContentPasteIcon />}
              onClick={copyQRCode}
            >
              Copy QR Code
            </Button>
            : null
        }
      </Stack>
    </PrettyModal>
  );
}