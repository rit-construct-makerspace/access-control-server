import { useMutation } from "@apollo/client/react";
import { ToolItemInstance, ToolItemType } from "../../../types/ToolItem";
import { GET_TOOL_ITEM_INSTANCES_BY_BORROWER, GET_TOOL_ITEM_INSTANCES_BY_TYPE, GET_TOOL_ITEM_TYPES_WITH_INSTANCES, RETURN_INSTANCE } from "../../../queries/toolItemQueries";
import PrettyModal from "../../../common/PrettyModal";
import { Box, Button, Card, Typography } from "@mui/material";
import AuditLogEntity from "../audit_logs/AuditLogEntity";


export function ReturnToolItemModal({item, setItem, type}: {item: ToolItemInstance, setItem: React.Dispatch<React.SetStateAction<ToolItemInstance | undefined>>, type: ToolItemType}) {
  const [returnItem] = useMutation(RETURN_INSTANCE, {
    refetchQueries: [{query: GET_TOOL_ITEM_TYPES_WITH_INSTANCES}, {query: GET_TOOL_ITEM_INSTANCES_BY_BORROWER, variables: {id: item.borrower.id}}, {query: GET_TOOL_ITEM_INSTANCES_BY_TYPE, variables: {id: type.id}}]
  });

  function handleSubmit () {
    returnItem({variables: {instanceID: item.id}});
    setItem(undefined);
  }

  return (
    <PrettyModal open={!!item} onClose={() => setItem(undefined)}>
      <Typography variant="h5">Return Loan {item.type.name} - '{item.uniqueIdentifier}'</Typography>

      {type.checkinNote && type.checkinNote !== "" && <Card sx={{mt: 3, p: 1}}>
        <Typography variant="h6">Note:</Typography>
        <Typography variant="body1">{type.checkinNote}</Typography>
      </Card>}

      <Box my={5}>
      <Typography mt={2} variant="h6">User:</Typography>
      <Typography variant="body1"><AuditLogEntity entityCode={`user:${item.borrower.id}:${item.borrower.firstName} ${item.borrower.lastName}`} /></Typography>
      </Box>
      
      <Button fullWidth variant="contained" onClick={handleSubmit}>Return</Button>
    </PrettyModal>
  );
}