import { useMutation, useQuery } from "@apollo/client/react";
import { useParams } from "react-router-dom";
import { GET_INVENTORY_ITEM, GET_INVENTORY_ITEMS_BY_TAG, SET_ITEM_AMOUNT } from "../../../queries/inventoryQueries";
import { Autocomplete, Button, Stack, TextField, Typography } from "@mui/material";
import InventoryItem from "../../../types/InventoryItem";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { useState, useMemo, useEffect, useEffectEvent } from "react";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useDebounce } from "../../../common/useDebounce";

interface QuickEditInventoryPageProps {
  fromTag: boolean
}

export default function QuickEditInventoryPage(props: QuickEditInventoryPageProps) {
  const { invID } = useParams<{ invID: string }>();

  const isMobile = useIsMobile();

  const tagResult = useQuery(GET_INVENTORY_ITEMS_BY_TAG, { variables: { tagID: Number(invID) }, skip: !props.fromTag });
  const itemResult = useQuery(GET_INVENTORY_ITEM, { variables: { id: invID }, skip: props.fromTag });

  const invItemsResult = props.fromTag ? tagResult : itemResult;

  const [setItemAmount] = useMutation(SET_ITEM_AMOUNT, { refetchQueries: ["GetInventoryItem", "InventoryItemsByTag"] });

  const invItems: InventoryItem[] = useMemo(() => {
    if (invItemsResult.data === undefined) { return [] }
    if (props.fromTag) {
      return invItemsResult.data.inventoryItemsByTag
    } else {
      return [invItemsResult.data.InventoryItem]
    }
  }, [invItemsResult.data, props.fromTag])

  const [selectedItem, setSelectedItem] = useState<InventoryItem>();

  const evaluatedItem = useMemo(() => {
    if (props.fromTag) {
      return selectedItem;
    } else {
      return invItems.length > 0 ? invItems[0] : undefined;
    }
  }, [invItems, selectedItem, props.fromTag])

  const [quantity, setQuantity] = useState(evaluatedItem?.count ?? -1);
  useEffect(() => setQuantity(evaluatedItem?.count ?? -1), [evaluatedItem])

  const debouncedQuantity = useDebounce(quantity, 250);
  const handleDebounceChange = useEffectEvent(() => {
    if (evaluatedItem !== undefined && debouncedQuantity !== -1 && debouncedQuantity !== evaluatedItem.count) {
      setItemAmount({ variables: { itemID: Number(evaluatedItem.id), count: debouncedQuantity } });
    }
  })
  useEffect(() => {
    handleDebounceChange();
  }, [debouncedQuantity, handleDebounceChange])

  return (
    <Stack spacing={4} justifyContent={"center"}>
      <title>Quick Edit Inventory</title>
      <Typography variant={isMobile ? "h5" : "h3"}>Quick Manage Item{invItems.length > 1 ? "s" : ""}</Typography>
      <Autocomplete
        key={invItems.length}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Item"
            placeholder={evaluatedItem ? "" : "Select Item..."}
          />
        )}
        options={invItems}
        disabled={!props.fromTag}
        value={evaluatedItem}
        onChange={(e, newValue) => setSelectedItem(newValue ?? undefined)}
        getOptionLabel={(option) => option.name}
        renderValue={(item) => item.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />
      <Stack direction={"row"} width={"100%"} justifyContent={"space-around"} alignItems={"center"}>
        <Button
          color="error"
          disabled={evaluatedItem === undefined}
          variant="contained"
          size="large"
          onClick={() => setQuantity(quantity <= 0 ? 0 : quantity - 1)}
        >
          <RemoveIcon />
        </Button>
        <Typography
          variant="h6"
          fontWeight={"bold"}
        >
          {evaluatedItem === undefined ? "--" : quantity}
        </Typography>
        <Button
          color="success"
          disabled={evaluatedItem === undefined}
          variant="contained"
          size="large"
          onClick={() => setQuantity(quantity + 1)}
        >
          <AddIcon />
        </Button>
      </Stack>
    </Stack>
  );
}