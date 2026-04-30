import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client/react";
import MaterialModalContents, {
  InventoryItemInput,
} from "./MaterialModalContents";
import { GET_INVENTORY_ITEMS, CREATE_INVENTORY_ITEM } from "../../../queries/inventoryQueries";
import { GET_MAKERSPACES_WITH_ITEMS } from "../../../queries/makerspaceQueries";


interface NewMaterialProps {
  onClose: () => void;
}

export default function NewMaterial({ onClose }: NewMaterialProps) {
  const [itemDraft, setItemDraft] = useState<Partial<InventoryItemInput>>({});

  const [createInventoryItem, { data, loading }] = useMutation(
    CREATE_INVENTORY_ITEM,
    {
      variables: { item: itemDraft },
      refetchQueries: [{
        query: GET_INVENTORY_ITEMS,
      },
      {
        query: GET_MAKERSPACES_WITH_ITEMS,
        variables: { makerspaceId: itemDraft.makerspaceID },
      },
      {
        query: GET_MAKERSPACES_WITH_ITEMS,
      }],
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