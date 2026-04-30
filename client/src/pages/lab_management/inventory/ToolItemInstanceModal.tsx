import { useMutation, useQuery } from "@apollo/client/react";
import { UPDATE_TOOL_ITEM_INSTANCE, GET_TOOL_ITEM_INSTANCES_BY_TYPE, CREATE_TOOL_ITEM_INSTANCE } from "../../../queries/toolItemQueries";
import { TOOL_ITEM_CONDITION_ARRAY, TOOL_ITEM_STATUS_ARRAY, ToolItemCondition, ToolItemInstance, ToolItemInstanceInput, ToolItemStatus, ToolItemType } from "../../../types/ToolItem";
import { useEffect, useState } from "react";
import PrettyModal from "../../../common/PrettyModal";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Divider, FormControl, InputLabel, MenuItem, Select, Stack, TextareaAutosize, TextField, Tooltip, Typography } from "@mui/material";
import GET_ROOMS from "../../../queries/roomQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import Room from "../../../types/Room";
import { useIsMobile } from "../../../common/IsMobileProvider";


export function ToolItemInstanceModal({ item, type }: { item?: ToolItemInstance, type: ToolItemType }) {
  const {makerspaceID} = useParams<{makerspaceID: string}>();
  const navigate = useNavigate();

  const getRooms = useQuery(GET_ROOMS);


  const currItem: ToolItemInstanceInput = {
    locationRoomID: item?.locationRoom.id ?? undefined,
    typeID: item?.type.id,
    ...item
  }

  const [editInstance] = useMutation(UPDATE_TOOL_ITEM_INSTANCE, { refetchQueries: [{ query: GET_TOOL_ITEM_INSTANCES_BY_TYPE, variables: { id: type.id } }] });
  const [createInstance] = useMutation(CREATE_TOOL_ITEM_INSTANCE, { refetchQueries: [{ query: GET_TOOL_ITEM_INSTANCES_BY_TYPE, variables: { id: type.id } }] });

  const [UIDAlert, setUIDAlert] = useState<boolean>(false);


  const blankItem: ToolItemInstanceInput = {
    typeID: type.id,
    uniqueIdentifier: undefined,
    locationRoomID: type.defaultLocationRoom?.id ?? undefined,
    locationDescription: type.defaultLocationDescription ?? undefined,
    condition: ToolItemCondition.NEW,
    status: ToolItemStatus.AVAILABLE,
    notes: undefined
  }

  const [newItem, setNewItem] = useState<ToolItemInstanceInput>((item ? currItem : blankItem));

  function close() {
    navigate(`/makerspace/${makerspaceID}/tools`)
  }

  function handleEditSubmit() {
    if (!newItem.uniqueIdentifier || newItem.uniqueIdentifier === "") {
      setUIDAlert(true);
      return;
    } else setUIDAlert(false);

    setNewItem({...newItem, typeID: Number(newItem.typeID), locationRoomID: Number(newItem.locationRoomID)});

    if (item) editInstance({variables: {id: item.id, toolItemInstance: {
      typeID: newItem.typeID,
      uniqueIdentifier: newItem.uniqueIdentifier,
      locationRoomID: newItem.locationRoomID,
      locationDescription: newItem.locationDescription,
      condition: newItem.condition,
      status: newItem.status,
      notes: newItem.notes
    }}});
    else createInstance({variables: {toolItemInstance: {
      typeID: newItem.typeID,
      uniqueIdentifier: newItem.uniqueIdentifier,
      locationRoomID: newItem.locationRoomID,
      locationDescription: newItem.locationDescription,
      condition: newItem.condition,
      status: newItem.status,
      notes: newItem.notes
    }}})

    close();
  }

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
  const isMobile = useIsMobile();


  return (
    <PrettyModal open={true} onClose={close} width={isMobile ? width : 400}>
      <Box mb={5}>
        <Typography variant="h5">{item?.uniqueIdentifier ? `Edit ${type.name} Instance "${item.uniqueIdentifier}"` : `Create ${type.name} Item Instance`}</Typography>
      </Box>
      <Stack direction={"column"} spacing={3}>
        <Stack direction={"row"}>
          <Tooltip title={"The name that will be used to refer to this instance in search and log history"}>
            <TextField label="Unique Identifier" placeholder={`Unique Identifier`} 
              value={newItem.uniqueIdentifier} onChange={(e) => setNewItem({...newItem, uniqueIdentifier: e.target.value})}/>
          </Tooltip>
        </Stack>
        <Divider>Location</Divider>
        <Stack direction={"row"} spacing={3}>
          <RequestWrapper loading={getRooms.loading} error={getRooms.error}>
            <FormControl sx={{width: "50%"}}>
              <InputLabel id="room-label">Room</InputLabel>
              <Select value={newItem.locationRoomID} id="room-label" label="Room" onChange={(e) => setNewItem({...newItem, locationRoomID: Number(e.target.value)})}>
                {getRooms.data?.rooms.map((room: Room) => (
                  <MenuItem value={room.id}>{room.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </RequestWrapper>
          <TextField label="Location Description" placeholder={`Location Description`} 
              value={newItem.locationDescription} onChange={(e) => setNewItem({...newItem, locationDescription: e.target.value})}/>
        </Stack>
        <Divider>Use Variables</Divider>
        <Stack direction={"row"} spacing={3}>
          <FormControl sx={{width: "50%"}}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select id="status-label" value={newItem.status} label="Status" onChange={(e) => setNewItem({...newItem, status: e.target.value})}>
              {TOOL_ITEM_STATUS_ARRAY.map((status: ToolItemStatus) => (
                <MenuItem value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{width: "50%"}}>
            <InputLabel id="condition-label">Condition</InputLabel>
            <Select id="condition-label" value={newItem.condition} label="Condition" onChange={(e) => setNewItem({...newItem, condition: e.target.value})}>
              {TOOL_ITEM_CONDITION_ARRAY.map((condition: ToolItemCondition) => (
                <MenuItem value={condition}>{condition}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <Divider>Item Info</Divider>
        <Stack direction={"column"}>
          <TextareaAutosize value={newItem.notes} placeholder="Notes" onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
            style={{background: "none", fontFamily: "Roboto", fontSize: "1em", lineHeight: "2em"}}></TextareaAutosize>
        </Stack>
        <Divider></Divider>
        {UIDAlert && <Typography color={"error"} variant="body2">Unique Identifier cannot be blank</Typography>}
        <Button onClick={handleEditSubmit} variant="contained" color="primary">{item ? "Save" : "Create"}</Button>
      </Stack>
    </PrettyModal>
  );
}