import { IconButton, Select, MenuItem, Chip } from "@mui/material";
import { Stack } from "@mui/system";
import InventoryItem, { InventoryTag } from "../../../../types/InventoryItem";
import InventoryTagChip from "../InventoryTagChip";
import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { ADD_TAG_TO_ITEM, GET_INVENTORY_ITEMS, REMOVE_TAG_FROM_ITEM } from "../../../../queries/inventoryQueries";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface TagsCellProps {
  item: InventoryItem;
  allTags: InventoryTag[];
}

export function TagsCell(props: TagsCellProps) {
  const [addTag] = useMutation(ADD_TAG_TO_ITEM, {
    refetchQueries: [{ query: GET_INVENTORY_ITEMS }]
  });

  const [removeTag] = useMutation(REMOVE_TAG_FROM_ITEM, {
    refetchQueries: [{ query: GET_INVENTORY_ITEMS }]
  });

  const handleRemoveTagClick = (id: number) => {
    removeTag({ variables: { itemID: props.item.id, tagID: id } });
  }

  const [showTagsDropdown, setShowTagsDropdown] = useState<boolean>(false);

  const handleAddTagClick = (id: number) => {
    addTag({ variables: { itemID: props.item.id, tagID: id } });
    setShowTagsDropdown(false);
  }

  return (
    <Stack direction={"row"} flexWrap={"wrap"}>
      {props.item.tags && props.item.tags.map((tag: InventoryTag) => (
        tag && <InventoryTagChip id={tag.id} label={tag.label} color={tag.color} removeTag={handleRemoveTagClick} />
      ))}
      <div style={{ alignSelf: 'flex-end' }}>
        <IconButton onClick={() => setShowTagsDropdown(!showTagsDropdown)}>{showTagsDropdown ? <ExpandLessIcon /> : <AddCircleIcon />}</IconButton>
        {showTagsDropdown &&
          <Select defaultOpen={showTagsDropdown}>
            {props.allTags.map((tag: InventoryTag) => (
              <MenuItem onClick={() => handleAddTagClick(tag.id)}><Chip variant="outlined" color={tag.color as ("default" | "primary" | "secondary" | "warning" | "info" | "error" | "success")} label={tag.label} /></MenuItem>
            ))}
          </Select>}
      </div>
    </Stack>
  )
}