import React, { useEffect, useState } from "react";
import { gql, useMutation } from "@apollo/client";
import MaterialModalContents, {
  InventoryItemInput,
} from "./MaterialModalContents";
import { GET_INVENTORY_ITEMS, CREATE_INVENTORY_ITEM} from "../../../queries/inventoryQueries";


interface NewMaterialProps {
  onClose: () => void;
}

export default function NewMaterial({ onClose }: NewMaterialProps) {
  const [itemDraft, setItemDraft] = useState<Partial<InventoryItemInput>>({});

  const [createInventoryItem, { data, loading }] = useMutation(
    CREATE_INVENTORY_ITEM,
    {
      variables: { item: itemDraft },
      refetchQueries: [{ query: GET_INVENTORY_ITEMS }],
    }
  );

  // Close the modal upon successful mutation
  useEffect(() => {
    if (data?.createInventoryItem?.id) onClose();
  }, [data, onClose]);

  return (
    <MaterialModalContents
      isNewItem={true}
      itemDraft={itemDraft}
      setItemDraft={setItemDraft}
      onSave={createInventoryItem}
      onDelete={onClose}
      loading={loading}
    />
  );
}