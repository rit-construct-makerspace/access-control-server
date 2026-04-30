import { useLazyQuery, useMutation } from "@apollo/client/react";
import { ToolItemInstance, ToolItemType } from "../../../types/ToolItem";
import { BORROW_INSTANCE, GET_TOOL_ITEM_INSTANCES_BY_BORROWER, GET_TOOL_ITEM_INSTANCES_BY_TYPE, GET_TOOL_ITEM_TYPES_WITH_INSTANCES } from "../../../queries/toolItemQueries";
import PrettyModal from "../../../common/PrettyModal";
import { Box, Button, Card, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { GET_USER_BY_USERNAME_OR_UID, PartialUser } from "../../../queries/userQueries";
import AuditLogEntity from "../audit_logs/AuditLogEntity";
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';


export function LoanToolItemModal({item, setItem, type}: {item: ToolItemInstance, setItem: React.Dispatch<React.SetStateAction<ToolItemInstance | undefined>>, type: ToolItemType}) {
  const [borrowItem] = useMutation(BORROW_INSTANCE, {
    refetchQueries: [{query: GET_TOOL_ITEM_TYPES_WITH_INSTANCES}, {query: GET_TOOL_ITEM_INSTANCES_BY_BORROWER}, {query: GET_TOOL_ITEM_INSTANCES_BY_TYPE}]
  });

  const [getUser, getUserResult] = useLazyQuery(GET_USER_BY_USERNAME_OR_UID);
  const getUserSafe: PartialUser | undefined = getUserResult.data?.userByUsernameorUID ?? undefined;

  const [userSearch, setUserSearch] = useState<string>();

  function handleUserSearchChange(e: any) {
    setUserSearch(e.target.value.toLowerCase());

    getUser({ variables: { value: e.target.value.toLowerCase() } });
  }

  function handleSubmit () {
    borrowItem({variables: {userID: getUserSafe?.id, instanceID: item.id}});
    setItem(undefined);
  }

  const USER_LOADING = (<Stack direction={"row"}>
    <CircularProgress />
    <Typography variant="body1">
      Loading
    </Typography>
  </Stack>);

  const USER_NOT_FOUND = (<Stack direction={"row"}>
    <CloseIcon color="error" />
    <Typography variant="body1">
      User Not Found
    </Typography>
  </Stack>);

  const USER_FOUND = (<Stack direction={"row"}>
    <CheckIcon color="success" />
    <Typography variant="body1">
      Found: <AuditLogEntity entityCode={`user:${getUserSafe?.id}:${getUserSafe?.firstName} ${getUserSafe?.lastName}`} />
    </Typography>
  </Stack>);

  const USER_STATE = getUserResult.loading ? USER_LOADING
    : (!getUserSafe ? USER_NOT_FOUND : USER_FOUND);

  return (
    <PrettyModal open={!!item} onClose={() => setItem(undefined)}>
      <Typography variant="h5">Loan {item.type.name} - '{item.uniqueIdentifier}'</Typography>

      {type.checkoutNote && type.checkoutNote !== "" && <Card sx={{mt: 3, p: 1}}>
        <Typography variant="h6">Note:</Typography>
        <Typography variant="body1">{type.checkoutNote}</Typography>
      </Card>}

      <Box my={5} height={100}>
        <Typography mb={2} variant="body1">Enter Borrower Card ID or Username</Typography>
        <TextField label="Find User" placeholder="ex: 1234567890 or abc1234" value={userSearch} onChange={handleUserSearchChange} sx={{minWidth: "70%"}} />
        {USER_STATE}
      </Box>
      
      <Button fullWidth variant="contained" onClick={handleSubmit} disabled={!getUserSafe}>Loan</Button>
    </PrettyModal>
  );
}