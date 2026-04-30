import { Switch } from "@mui/material";
import InventoryItem from "../../../../types/InventoryItem";
import { useMutation } from "@apollo/client/react";
import { isManager } from "../../../../common/PrivilegeUtils";
import { SET_STAFF_ONLY, GET_INVENTORY_ITEMS } from "../../../../queries/inventoryQueries";
import { useCurrentUser } from "../../../../common/CurrentUserProvider";

export function StaffOnlyToggle(props: { item: InventoryItem }) {
  const currentUser = useCurrentUser();

  const [setStaffOnly] = useMutation(SET_STAFF_ONLY, {
    variables: { id: props.item.id, staffOnly: !props.item.staffOnly },
    refetchQueries: [{ query: GET_INVENTORY_ITEMS }]
  });

  function handleToggleStaffOnly() {
    setStaffOnly();
  }

  return (
    <Switch onChange={handleToggleStaffOnly} disabled={!isManager(currentUser)} defaultChecked={props.item.staffOnly}></Switch>
  );
}