import React, { useEffect, useState } from "react";
import { Chip, IconButton, MenuItem, Select, Stack, SxProps, TableCell, TableRow, Typography } from "@mui/material";
import { format, parseISO } from "date-fns";
import reactStringReplace from "react-string-replace";
import { ADD_TAG_TO_LOG, DELETE_MAINTENANCE_LOG, DELETE_RESOLUTION_LOG, GET_MAINTENANCE_LOGS, GET_RESOLUTION_LOGS, MaintenanceLogItem, MaintenanceTag, REMOVE_TAG_FROM_LOG, ResolutionLogItem } from "../../../queries/maintenanceLogQueries";
import AuditLogEntity from "../audit_logs/AuditLogEntity";
import ActionButton from "../../../common/ActionButton";
import DeleteIcon from '@mui/icons-material/Delete';
import Privilege from "../../../types/Privilege";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { useMutation } from "@apollo/client";
import MaintenanceTagChip from "./MaintenanceTagChip";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';


function formatDateTime(dateTime: string) {
  return format(parseISO(dateTime), "M/d/yy h:mmaaa").split(" ");
}

export default function ResolutionLogEntry({ logItem, allTags }: { logItem: ResolutionLogItem, allTags: MaintenanceTag[] }) {
  const currentUser = useCurrentUser();

  const [width, setWidth] = useState<number>(window.innerWidth);
  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }
  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    }
  }, []);
  const isMobile = width <= 1100;

  const tags = [logItem.tag1, logItem.tag2, logItem.tag3];

  const [showTagsDropdown, setShowTagsDropdown] = useState<boolean>(false);

  const [date, time] = formatDateTime(logItem.timestamp);

  const [deleteLog] = useMutation(DELETE_RESOLUTION_LOG, {
    variables: {id: logItem.id}, 
    refetchQueries: [{ query: GET_RESOLUTION_LOGS, variables: {equipmentID: logItem.equipment?.id} }] });

  const [addTag] = useMutation(ADD_TAG_TO_LOG, {
    refetchQueries: [{ query: GET_RESOLUTION_LOGS, variables: {equipmentID: logItem.equipment?.id} }] });

  const [removeTag] = useMutation(REMOVE_TAG_FROM_LOG, {
    refetchQueries: [{ query: GET_RESOLUTION_LOGS, variables: {equipmentID: logItem.equipment?.id} }] });

  const handleDeleteClick = () => {
    if (!window.confirm("Are you sure you want to delete this log? This cannot be undone.")) return;
    deleteLog();
  };

  const handleRemoveTagClick = (id: number) => {
    removeTag({variables: {logId: logItem.id, tagId: id, logType: "resolution"}});
  }

  const handleAddTagClick = (id: number) => {
    addTag({variables: {logId: logItem.id, tagId: id, logType: ("resolution")}});
    setShowTagsDropdown(false);
  }

  return (
    <TableRow>
      <TableCell>
        <IconButton hidden={currentUser.privilege != Privilege.STAFF} color="error" onClick={handleDeleteClick}><DeleteIcon /></IconButton>
      </TableCell>
      <TableCell>
        {logItem.instance?.name ?? <i>None</i>}
      </TableCell>
      <TableCell>
        <Stack direction={isMobile ? "row" : "column"}>
          <Typography color={localStorage.getItem("themeMode") == "dark" ? "grey.300" : "grey.700"} sx={{ width: 70 }} variant="body2">
            {date}
          </Typography>
          <Typography color={localStorage.getItem("themeMode") == "dark" ? "grey.300" : "grey.700"} sx={{ width: 93 }} variant="body2">
            {time}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack direction={"row"} flexWrap={"wrap"}>
          {tags.map((tag: MaintenanceTag) => (
            tag && <MaintenanceTagChip id={tag.id} label={tag.label} color={tag.color} removeTag={handleRemoveTagClick}/>
          ))}
          <div style={{alignSelf: 'flex-end'}}>
            <IconButton onClick={() => setShowTagsDropdown(!showTagsDropdown)}>{showTagsDropdown ? <ExpandLessIcon /> : <AddCircleIcon />}</IconButton>
            {showTagsDropdown && 
            <Select defaultOpen={showTagsDropdown}>
              {allTags.map((tag: MaintenanceTag) => (
                <MenuItem onClick={() => handleAddTagClick(tag.id)}><Chip variant="outlined" color={tag.color as ("default" | "primary" | "secondary" | "warning" | "info" | "error" | "success")} label={tag.label} /></MenuItem>
              ))}
            </Select>}
          </div>
        </Stack>
      </TableCell>
      <TableCell>
        <AuditLogEntity entityCode={`equipment:${logItem.id}:${logItem.author.firstName} ${logItem.author.lastName}`} />
      </TableCell>
      <TableCell sx={{width: 800}}>
        {logItem.issue}
      </TableCell>
      <TableCell sx={{width: 800}}>
        {logItem.content}
      </TableCell>
    </TableRow>
  );
}
