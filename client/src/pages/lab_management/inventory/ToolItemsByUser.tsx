import { useLazyQuery, useQuery } from "@apollo/client";
import { GET_USER } from "../users/UserModal";
import { GET_USER_BY_USERNAME_OR_UID, PartialUser } from "../../../queries/userQueries";
import { GET_TOOL_ITEM_INSTANCES_BY_BORROWER } from "../../../queries/toolItemQueries";
import { useEffect, useState } from "react";
import { ToolItemInstance, ToolItemType } from "../../../types/ToolItem";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import AuditLogEntity from "../audit_logs/AuditLogEntity";
import SearchBar from "../../../common/SearchBar";
import { ToolItemInstanceCard } from "./ToolItemInstanceCard";


export function ToolItemsByUser({ handleReturnItemClick }: { handleReturnItemClick: (item: ToolItemInstance, type: ToolItemType) => void }) {
  const [getUser, getUserResult] = useLazyQuery(GET_USER_BY_USERNAME_OR_UID);
  const getUserSafe: PartialUser | undefined = getUserResult.data?.userByUsernameorUID ?? undefined;

  const [getToolItems, getToolItemsResult] = useLazyQuery(GET_TOOL_ITEM_INSTANCES_BY_BORROWER);

  const [getToolItemsSafe, setToolItemsSafe] = useState(getToolItemsResult.data?.toolItemInstancesByBorrower ?? []);

  const [userSearch, setUserSearch] = useState<string>();

  function handleUserSearchChange(e: any) {
    setUserSearch(e.target.value);
  }

  useEffect(() => {
    getUser({ variables: { value: userSearch } }).then((result) => {
      console.log(userSearch)
    });
    getToolItems({variables: {id: getUserSafe?.id ?? 0}});
    setToolItemsSafe(getToolItemsResult.data?.toolItemInstancesByBorrower ?? []);
  }, [userSearch, setUserSearch, getToolItemsSafe]);

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
    <Box>
      <Typography variant="h4">Find Items By Borrowing User</Typography>
      <SearchBar
        value={userSearch}
        onChange={handleUserSearchChange} />
      {USER_STATE}

      {!getToolItemsResult.loading && <Stack direction={"row"}>
        {getToolItemsSafe.map((item: ToolItemInstance) => (
          <ToolItemInstanceCard item={item} handleLoanClick={() => console.log("This isn't supposed to happen")} handleReturnClick={(item: ToolItemInstance) => handleReturnItemClick(item, item.type)} />
        ))}
        {getToolItemsSafe.length == 0 && <Typography m={3} variant="h6" color={"secondary"}>No items to show.</Typography>}
      </Stack>}
    </Box>
  );
}