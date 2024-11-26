import React, { useEffect, useState } from "react";
import MaterialModalContents, {
  InventoryItemInput,
} from "./MaterialModalContents";
import { gql, useMutation, useQuery } from "@apollo/client";
import RequestWrapper from "../../../common/RequestWrapper";
import { GET_INVENTORY_ITEMS, GET_INVENTORY_ITEM, UPDATE_INVENTORY_ITEM, DELETE_INVENTORY_ITEM } from "../../../queries/inventoryQueries";


interface EditMaterialProps {
  itemId: string;
  onClose: () => void;
}

export default function EditMaterial({ itemId, onClose }: EditMaterialProps) {
  const [itemDraft, setItemDraft] = useState<Partial<InventoryItemInput>>({});

  const query = useQuery(GET_INVENTORY_ITEM, {
    variables: { id: itemId },
  });

  const [updateInventoryItem, mutation] = useMutation(UPDATE_INVENTORY_ITEM, {
    variables: { id: itemId, item: {...itemDraft, id: undefined, tags: undefined} },
    refetchQueries: [
      { query: GET_INVENTORY_ITEMS },
      { query: GET_INVENTORY_ITEM, variables: { id: itemId } },
    ],
  });

  const [deleteInventoryItem, deletion] = useMutation(DELETE_INVENTORY_ITEM, {
    variables: { id: itemId },
    refetchQueries: [
      { query: GET_INVENTORY_ITEMS },
    ],
  });

  // After the item has been fetched, fill in the draft
  useEffect(() => {
    if (!query.data?.InventoryItem) return;
    setItemDraft({
      ...query.data.InventoryItem,
      __typename: undefined,
    });
  }, [query.data, setItemDraft]);

  // Close the modal upon successful mutation
  useEffect(() => {
    if (mutation.data != undefined) onClose();
  }, [mutation.data, onClose]);

  return (
    <RequestWrapper loading={query.loading} error={query.error} minHeight={322}>
      <MaterialModalContents
        isNewItem={false}
        itemDraft={itemDraft}
        setItemDraft={setItemDraft}
        onSave={updateInventoryItem}
        onDelete={() => {
          deleteInventoryItem()
          onClose()
        }}
        loading={mutation.loading}
      />
    </RequestWrapper>
  );
}
