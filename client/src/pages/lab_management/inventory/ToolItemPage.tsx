import { Box, Button, Stack, Typography } from "@mui/material";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import AddIcon from '@mui/icons-material/Add';
import { useQuery } from "@apollo/client/react";
import { GET_TOOL_ITEM_TYPES_WITH_INSTANCES } from "../../../queries/toolItemQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import { ToolItemInstance, ToolItemType } from "../../../types/ToolItem";
import { ToolItemTypeCard } from "./ToolItemTypeCard";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ToolItemTypeModal } from "./ToolItemTypeModal";
import { useState } from "react";
import { LoanToolItemModal } from "./LoanToolItemModal";
import { ReturnToolItemModal } from "./ReturnToolItemModal";
import { CreateToolItemInstanceModal, EditToolItemInstanceModal } from "./EditCreateToolItemInstanceModal";
import { GET_MAKERSPACE_BY_ID } from "../../../queries/makerspaceQueries";
import Room from "../../../types/Room";
import { isManager } from "../../../common/PrivilegeUtils";
import { useMakeTheme } from "../../../common/MakeThemeProvider";


export function ToolItemPage() {
  const { typeid, instanceid, makerspaceID } = useParams<{ typeid: string, instanceid: string, makerspaceID: string }>();

  const [searchParams] = useSearchParams()
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const makeTheme = useMakeTheme();

  const getToolItemTypes = useQuery(GET_TOOL_ITEM_TYPES_WITH_INSTANCES);
  const getMakerspace = useQuery(GET_MAKERSPACE_BY_ID, { variables: { id: makerspaceID } });

  const [currentType, setCurrentType] = useState<ToolItemType>();

  const [loanItem, setLoanItem] = useState<ToolItemInstance>();
  function handleLoanInstanceClick(item: ToolItemInstance, type: ToolItemType) {
    setLoanItem(item);
    setCurrentType(type);
  }

  const [returnItem, setReturnItem] = useState<ToolItemInstance>();
  function handleReturnInstanceClick(item: ToolItemInstance, type: ToolItemType) {
    setReturnItem(item);
    setCurrentType(type);
  }

  return (
    <Box padding="25px">
      {/* <ToolItemsByUser handleReturnItemClick={handleReturnInstanceClick} /> */}
      <title>{`Tools | ${makeTheme.title}`}</title>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" paddingBottom="10px">
        <Typography variant="h4">Tools</Typography>
        {isManager(currentUser) && <Button startIcon={<AddIcon />} variant="outlined" color="primary" onClick={() => navigate(`/makerspace/${makerspaceID}/tools/type`)}>Create Type</Button>}
      </Stack>

      <RequestWrapper loading={getToolItemTypes.loading || getMakerspace.loading} error={getToolItemTypes.error || getMakerspace.error}>
        <Stack direction={"column"} spacing={4}>
          {getToolItemTypes.data?.toolItemTypes.filter((type: ToolItemType) => getMakerspace.data?.makerspaceByID.rooms.find((room: Room) => Number(room.id) === Number(type.defaultLocationRoom.id))).map((type: ToolItemType) => (
            <ToolItemTypeCard type={type} handleLoanInstanceClick={handleLoanInstanceClick} handleReturnInstanceClick={handleReturnInstanceClick} />
          ))}

          {location.pathname.includes("type") && !getToolItemTypes.loading && <ToolItemTypeModal type={!typeid ? undefined : getToolItemTypes.data?.toolItemTypes.find((type: ToolItemType) => Number(type.id) === Number(typeid))} />}
          {location.pathname.includes("instance") && searchParams.get("type") && !getToolItemTypes.loading && (instanceid
            ? <EditToolItemInstanceModal itemID={Number(instanceid)} type={getToolItemTypes.data?.toolItemTypes.find((type: ToolItemType) => Number(type.id) === Number(searchParams.get("type")))} />
            : <CreateToolItemInstanceModal type={getToolItemTypes.data?.toolItemTypes.find((type: ToolItemType) => Number(type.id) === Number(searchParams.get("type")))} />)}
        </Stack>
      </RequestWrapper>

      {loanItem && currentType && <LoanToolItemModal item={loanItem} setItem={setLoanItem} type={currentType} />}
      {returnItem && currentType && <ReturnToolItemModal item={returnItem} setItem={setReturnItem} type={currentType} />}
    </Box>
  );
}