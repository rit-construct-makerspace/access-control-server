import { IconButton } from "@mui/material";
import { useMutation } from "@apollo/client/react";
import { DELETE_INVENTORY_LEDGER, GET_LEDGERS } from "../../../queries/inventoryQueries";
import DeleteIcon from '@mui/icons-material/Delete';
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { isManager } from "../../../common/PrivilegeUtils";

const CONFIRM_PROMPT =
  "Are you sure you want to delete this material? This cannot be undone.";

interface LedgerDeleteButtonProps {
  itemID: number
}

export default function LedgerDeleteButton({ itemID }: LedgerDeleteButtonProps) {
  const currentUser = useCurrentUser();

  const [deleteLedger] = useMutation(DELETE_INVENTORY_LEDGER, { variables: { id: itemID }, refetchQueries: [{ query: GET_LEDGERS }] });

  const handleClick = () => {
    if (!window.confirm(CONFIRM_PROMPT)) return;
    deleteLedger();
  };

  return (
    <IconButton disabled={!isManager(currentUser)} color="error" onClick={handleClick}><DeleteIcon /></IconButton>
  );
}
