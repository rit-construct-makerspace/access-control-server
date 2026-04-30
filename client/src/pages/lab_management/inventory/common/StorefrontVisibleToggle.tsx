import { Switch } from "@mui/material";
import InventoryItem from "../../../../types/InventoryItem";
import { useMutation } from "@apollo/client/react";
import { isManager } from "../../../../common/PrivilegeUtils";
import { GET_INVENTORY_ITEMS, SET_STOREFRONT_VISIBLE } from "../../../../queries/inventoryQueries";
import { useCurrentUser } from "../../../../common/CurrentUserProvider";

export function StorefrontVisibleToggle(props: { item: InventoryItem }) {
  const currentUser = useCurrentUser();

  const [setStorefront] = useMutation(SET_STOREFRONT_VISIBLE, {
    variables: {id: props.item.id, storefrontVisible: !props.item.storefrontVisible}, 
    refetchQueries: [{query: GET_INVENTORY_ITEMS}]});

  function handleToggleStorefrontVisible() {
    setStorefront();
  }

  return (
    <Switch onChange={handleToggleStorefrontVisible} disabled={props.item.staffOnly && !isManager(currentUser)} defaultChecked={props.item.storefrontVisible}></Switch>
  );
}