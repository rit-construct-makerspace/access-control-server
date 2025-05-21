import { Box, Card, CardContent, CardHeader, CardMedia, Collapse, Divider, Grid, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { ToolItemInstance, ToolItemType } from "../../../types/ToolItem";
import ActionButton from "../../../common/ActionButton";
import Privilege from "../../../types/Privilege";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { DELETE_TYPE, GET_TOOL_ITEM_TYPES } from "../../../queries/toolItemQueries";
import { useNavigate } from "react-router-dom";
import { ToolItemInstanceCard } from "./ToolItemInstanceCard";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Markdown from "react-markdown";
import AddIcon from '@mui/icons-material/Add';


export function ToolItemTypeCard({ type, handleLoanInstanceClick, handleReturnInstanceClick }: { type: ToolItemType, handleLoanInstanceClick: (item: ToolItemInstance, type: ToolItemType) => void, handleReturnInstanceClick: (item: ToolItemInstance, type: ToolItemType) => void }) {
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showInstances, setShowInstances] = useState<boolean>(false);

  const [deleteInstance] = useMutation(DELETE_TYPE, { variables: { id: type.id }, refetchQueries: [{ query: GET_TOOL_ITEM_TYPES }] });

  const currentUser = useCurrentUser();

  function handleDeleteClick() {
    if (!window.confirm(`Are you sure you want to delete '${type.name}? This will delete all instances of this type and cnnot be undone.`)) return;
    deleteInstance();
  }

  function handleEditModalOpen() {
    navigate(`/admin/tools/type/${type.id}`);
  }

  const CONTROL_MENU = (
    <div>
      <IconButton size={"medium"} color={"secondary"} onClick={(e) => { setAnchorEl(e.currentTarget); setShowMenu(!showMenu); }}><MoreVertIcon /></IconButton>
      <Menu
        open={showMenu}
        id={`more-type-${type.id}`}
        onClose={() => setShowMenu(!showMenu)}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEditModalOpen} color="primary"><ListItemIcon><EditIcon /></ListItemIcon><ListItemText>Edit</ListItemText></MenuItem>
        <MenuItem onClick={handleDeleteClick} color="error"><ListItemIcon><DeleteIcon /></ListItemIcon><ListItemText>Delete</ListItemText></MenuItem>
      </Menu>
    </div>
  );

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


  return (
    <Card>
      <Stack direction={isMobile ? "column" : "row"}>
        <CardMedia
          component="img"
          width={150}
          height={150}
          image={type.imageUrl ? `${process.env.REACT_APP_CDN_URL}${process.env.REACT_APP_CDN_TOOL_DIR}/${type.imageUrl}` : `${process.env.REACT_APP_CDN_URL}/shed_acronym_vert.jpg`}
          alt={`${type.name} image`}
          sx={{ width: 150 }} />
        <Box width={"98.5%"} pl={"1.5%"}>
          <CardHeader title={<Typography variant="h4" pt={"2%"}>{type.name}</Typography>} action={currentUser.privilege == Privilege.STAFF && CONTROL_MENU} sx={{ height: 15, pb: 3, pl: 1 }}></CardHeader>
          <Box my={2} mx={2} py={1} px={1} border={`1px solid ${localStorage.getItem("themeMode") == "dark" ? "#000000" : "#fafafa"}`}>
            <Markdown>{type.description}</Markdown>
          </Box>
        </Box>
      </Stack>
      <Divider />
      <CardContent sx={{ background: localStorage.getItem("themeMode") == "dark" ? "linear-gradient(to bottom, #1e1e1e, #000000)" : "linear-gradient(to bottom, #ffffff, #fafafa)", p: 0 }}>
        <Stack direction={"row"} onClick={() => setShowInstances(!showInstances)} width={"95%"} justifyContent={"space-between"} p={"16px"}>
          <Typography variant="h6">Instances ({type.instances.length})</Typography>
          <Stack direction={"row"} alignItems={"center"} spacing={1}>
            {showInstances ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            <ActionButton iconSize={15} color={"success"} appearance={"icon-only"} handleClick={async () => navigate(`/admin/tools/instance?type=${type.id}`)} loading={false}><AddIcon /></ActionButton>
          </Stack>
        </Stack>
        <Collapse in={showInstances}>
          <Grid container spacing={2} py={2} px={"16px"}>
            {type.instances.length == 0 && <Grid pl={2}><Typography variant="body2" ml={5}>No Instances</Typography></Grid>}
            {type.instances.map((instance: ToolItemInstance) => (
              <Grid>
                <ToolItemInstanceCard item={instance} handleLoanClick={(item: ToolItemInstance) => handleLoanInstanceClick(item, type)} handleReturnClick={(item: ToolItemInstance) => handleReturnInstanceClick(item, type)} />
              </Grid>
            ))}
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
}