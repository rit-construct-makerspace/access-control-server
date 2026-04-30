import { Box, Button, Card, CardActions, CardContent, CardHeader, Chip, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Table, TableCell, TableRow, Typography, useTheme } from "@mui/material";
import { ToolItemCondition, ToolItemInstance, ToolItemStatus } from "../../../types/ToolItem";
import { useState } from "react";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { useMutation } from "@apollo/client/react";
import { DELETE_INSTANCE, GET_TOOL_ITEM_INSTANCES_BY_TYPE, GET_TOOL_ITEM_TYPES_WITH_INSTANCES } from "../../../queries/toolItemQueries";
import AuditLogEntity from "../audit_logs/AuditLogEntity";
import TimeAgo from 'react-timeago'
import { useNavigate, useParams } from "react-router-dom";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { isManager } from "../../../common/PrivilegeUtils";




export function ToolItemInstanceCard({ item, handleLoanClick, handleReturnClick }: { item: ToolItemInstance, handleLoanClick: (item: ToolItemInstance) => void, handleReturnClick: (item: ToolItemInstance) => void }) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);


  const [deleteInstance] = useMutation(DELETE_INSTANCE, { variables: { id: item.id }, refetchQueries: [{ query: GET_TOOL_ITEM_INSTANCES_BY_TYPE, variables: { id: item.type.id } }, { query: GET_TOOL_ITEM_TYPES_WITH_INSTANCES }] });

  const currentUser = useCurrentUser();

  function handleDeleteClick() {
    deleteInstance();
  }

  function handleEditModalOpen() {
    navigate(`/makerspace/${makerspaceID}/tools/instance/${item.id}?type=${item.type.id}`);
  }

  const theme = useTheme();

  const CARD_COLOR = ((
    item.status === ToolItemStatus.OUT ||
    item.status === ToolItemStatus.INTERNAL_USE
  ) ? ((localStorage.getItem("themeMode") === "dark") ? "#382a29" : "#f1d1ce")
    : (
      item.status === ToolItemStatus.MISSING ||
      item.condition === ToolItemCondition.DAMAGED ||
      item.condition === ToolItemCondition.MISSING_PARTS
    ) ? ((localStorage.getItem("themeMode") === "dark") ? "#382a29" : "#f1d1ce")
      : null);

  const STATUS_COLOR = ((
    item.status === ToolItemStatus.OUT ||
    item.status === ToolItemStatus.INTERNAL_USE ||
    item.status === ToolItemStatus.MISSING ||
    item.status === ToolItemStatus.DO_NOT_USE
  ) ? "error"
    : (
      item.status === ToolItemStatus.AVAILABLE
    ) ? "success"
      : undefined);

  const CONDITION_COLOR = ((
    item.condition === ToolItemCondition.NEW ||
    item.condition === ToolItemCondition.GOOD
  ) ? theme.palette.primary
    : (
      item.condition === ToolItemCondition.DAMAGED ||
      item.condition === ToolItemCondition.MISSING_PARTS
    ) ? theme.palette.error
      : null)?.main;

  const CONTROL_MENU = (
    <div>
      <IconButton size={"medium"} color={"secondary"} onClick={(e) => { setAnchorEl(e.currentTarget); setShowMenu(!showMenu); }}><MoreVertIcon /></IconButton>
      <Menu
        id="basic-menu"
        open={showMenu}
        anchorEl={anchorEl}
        onClose={() => setShowMenu(!showMenu)}
      >
        <MenuItem onClick={handleEditModalOpen} color="primary"><ListItemIcon><EditIcon /></ListItemIcon><ListItemText>Edit</ListItemText></MenuItem>
        <MenuItem onClick={handleDeleteClick} color="error"><ListItemIcon><DeleteIcon /></ListItemIcon><ListItemText>Delete</ListItemText></MenuItem>
      </Menu>
    </div>
  );

  const lastTimeDifference = item.borrowedAt ? (new Date().getTime() - new Date(item.borrowedAt).getTime()) : null;

  return (
    <Card sx={{ backgroundColor: CARD_COLOR, maxWidth: 380 }}>
      <CardHeader title={item.uniqueIdentifier} subheader={<Stack direction={"row"} justifyContent={"space-between"} alignItems={"flex-start"}><span>ID {item.id}</span><Chip label={item.status} color={STATUS_COLOR} variant="filled" size="small" /></Stack>} action={isManager(currentUser) && CONTROL_MENU} sx={{ pb: 0 }} />
      <CardContent sx={{ minHeight: 250, pb: 0 }}>
        <Box mb={2} height={"2em"} sx={{ overflowY: "scroll" }}>
          <Typography variant="body2">{item.notes}</Typography>
        </Box>
        <Table size="small">
          <TableRow>
            <TableCell align="left" sx={{ fontWeight: "bold", maxWidth: 140, minHeight: 60 }}>Condition</TableCell>
            <TableCell align="right" sx={{ color: CONDITION_COLOR }}>{item.condition}</TableCell>
          </TableRow>
          {item.borrower?.id && [
            <TableRow>
              <TableCell align="left" sx={{ fontWeight: "bold", maxWidth: 140, minHeight: 60 }}>Borrower</TableCell>
              <TableCell align="right"><AuditLogEntity entityCode={`user:${item.borrower.id}:${item.borrower.firstName} ${item.borrower.lastName}`} /></TableCell>
            </TableRow>,
            <TableRow>
              <TableCell align="left" sx={{ fontWeight: "bold", maxWidth: 140, minHeight: 60 }}>Borrowed</TableCell>
              <TableCell align="right">
                <span style={{ fontWeight: lastTimeDifference ?? 0 > 86400000 ? 'bold' : 'regular', color: lastTimeDifference ?? 0 > 86400000 ? 'red' : 'inherit' }}>
                  <TimeAgo date={new Date(Number(item.borrowedAt))} />
                </span>
              </TableCell>
            </TableRow>
          ]}
          <TableRow>
            <TableCell align="left" sx={{ fontWeight: "bold", maxWidth: 140, minHeight: 60 }}>Location</TableCell>
            <TableCell align="right">{item.locationRoom.name}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="left" sx={{ fontWeight: "bold", maxWidth: 140, minHeight: 60 }}>Location<br></br>Description</TableCell>
            <TableCell align="right">{item.locationDescription}</TableCell>
          </TableRow>
        </Table>
      </CardContent>
      <CardActions>
        {item.status === ToolItemStatus.OUT && <Button variant="text" color="error" fullWidth onClick={() => handleReturnClick(item)}>Return</Button>}
        {item.status === ToolItemStatus.AVAILABLE && <Button variant="text" color="secondary" fullWidth onClick={() => handleLoanClick(item)}>Loan</Button>}
        {(item.status === ToolItemStatus.DO_NOT_USE || item.status === ToolItemStatus.MISSING || item.status === ToolItemStatus.INTERNAL_USE) &&
          <Button variant="text" color="error" fullWidth disabled>Cannot Loan</Button>}
      </CardActions>
    </Card>
  );
}