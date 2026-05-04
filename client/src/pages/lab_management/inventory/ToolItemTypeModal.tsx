import { useMutation, useQuery } from "@apollo/client/react";
import { UPDATE_TOOL_ITEM_TYPE, GET_TOOL_ITEM_TYPES_WITH_INSTANCES, GET_TOOL_ITEM_TYPES, CREATE_TOOL_ITEM_TYPE } from "../../../queries/toolItemQueries";
import { ToolItemType, ToolItemTypeInput } from "../../../types/ToolItem";
import { useCallback, useEffect, useState } from "react";
import PrettyModal from "../../../common/PrettyModal";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Divider, InputLabel, FormControl, MenuItem, Select, Stack, Switch, TextField, Tooltip, Typography, FormControlLabel } from "@mui/material";
import GET_ROOMS from "../../../queries/roomQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import Room from "../../../types/Room";
import { useIsMobile } from "../../../common/IsMobileProvider";
import FileUploadButton from "../../../common/FileUploadButton";


export function ToolItemTypeModal({ type }: { type?: ToolItemType }) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const navigate = useNavigate();

  const getRooms = useQuery(GET_ROOMS);

  const [editType] = useMutation(UPDATE_TOOL_ITEM_TYPE, { refetchQueries: [{ query: GET_TOOL_ITEM_TYPES_WITH_INSTANCES }, { query: GET_TOOL_ITEM_TYPES }] });
  const [createType] = useMutation(CREATE_TOOL_ITEM_TYPE, { refetchQueries: [{ query: GET_TOOL_ITEM_TYPES_WITH_INSTANCES }, { query: GET_TOOL_ITEM_TYPES }] });

  const [nameAlert, setNameAlert] = useState<boolean>(false);

  const currType = {
    defaultLocationRoomID: type?.defaultLocationRoom.id ?? undefined,
    ...type
  }

  const blankType: ToolItemTypeInput = {
    name: undefined,
    defaultLocationRoomID: undefined,
    defaultLocationDescription: undefined,
    description: undefined,
    checkoutNote: undefined,
    checkinNote: undefined,
    allowCheckout: true,
    imageUrl: undefined
  }


  const [newType, setNewType] = useState<ToolItemTypeInput>((type ? currType : blankType));

  const close = useCallback(() => {
    navigate(`/makerspace/${makerspaceID}/tools`)
  }, [navigate, makerspaceID]);

  const handleEditSubmit = useCallback(() => {
    if (!newType.name || newType.name === "") {
      setNameAlert(true);
      return;
    } else setNameAlert(false);

    if (type) editType({
      variables: {
        id: type.id, toolItemType: {
          name: newType.name,
          defaultLocationRoomID: newType.defaultLocationRoomID,
          defaultLocationDescription: newType.defaultLocationDescription,
          description: newType.description,
          checkoutNote: newType.checkoutNote,
          checkinNote: newType.checkinNote,
          allowCheckout: newType.allowCheckout,
          imageUrl: newType.imageUrl
        }
      }
    });
    else createType({ variables: { toolItemType: newType } })

    close();
  }, [newType, close, createType, editType, type]);

  useEffect(() => {
    if (newType.imageUrl !== type?.imageUrl && newType !== blankType.imageUrl) {
      handleEditSubmit();
    }
  }, [newType, blankType.imageUrl, type?.imageUrl, handleEditSubmit]);

  const isMobile = useIsMobile()

  return (
    <PrettyModal open={true} onClose={close} width={isMobile ? "100%" : "600px"}>
      <Box mb={5}>
        <Typography variant="h5">{type?.name ? `Edit Type "${type.name}"` : `Create Item Type`}</Typography>
      </Box>
      <Stack direction={"column"} spacing={2}>
        <Stack direction={"row"} width={"100%"}>
          <Tooltip title={"The name that will be used to refer to this instance in search and log history"}>
            <TextField label="Name" placeholder={`Name`} fullWidth
              value={newType.name} onChange={(e) => setNewType({ ...newType, name: e.target.value })} />
          </Tooltip>
        </Stack>
        <Divider>Default Location</Divider>
        <Stack spacing={3}>
          <RequestWrapper loading={getRooms.loading} error={getRooms.error}>
            <FormControl>
              <InputLabel id="default-room">Room</InputLabel>
              <Tooltip title={"New instances under this type will use this Room by default"} placement="top">
                <Select id="default-room" value={newType.defaultLocationRoomID} label="Room"
                  onChange={(e) => setNewType({ ...newType, defaultLocationRoomID: Number(e.target.value) })}>
                  {getRooms.data?.rooms.map((room: Room) => (
                    <MenuItem value={room.id}>{room.name}</MenuItem>
                  ))}
                </Select>
              </Tooltip>
            </FormControl>
          </RequestWrapper>
          <Tooltip title={"New instances under this type will use this location description by default"} placement="top">
            <TextField
              label="Description" placeholder={`Description`}
              value={newType.defaultLocationDescription}
              onChange={(e) => setNewType({ ...newType, defaultLocationDescription: e.target.value })}
            />
          </Tooltip>
        </Stack>
        <Divider>Usage Info</Divider>
        <FormControlLabel
          control={<Switch value={newType.allowCheckout} onChange={() => setNewType({ allowCheckout: !newType.allowCheckout, ...newType })} />}
          label={"Allow Instances to be checked out?"}
          labelPlacement="start"
          sx={{ alignSelf: "center" }}
        />
        <Stack direction={"column"} spacing={3}>
          <Tooltip title={"This note will show when a user attempts to check out an instance of this type"}>
            <TextField label="Check-out Note" placeholder={`Check-out Note`}
              value={newType.checkoutNote} onChange={(e) => setNewType({ ...newType, checkoutNote: e.target.value })} />
          </Tooltip>
          <Tooltip title={"This note will show when a user attempts to check in an instance of this type"}>
            <TextField label="Check-in Note" placeholder={`Check-in Note`}
              value={newType.checkinNote} onChange={(e) => setNewType({ ...newType, checkinNote: e.target.value })} />
          </Tooltip>
        </Stack>
        <Divider>Type Info</Divider>
        <Stack direction={"column"} spacing={3}>
          <TextField
            value={newType.description}
            label={"Description"}
            placeholder="description"
            onChange={(e) => setNewType({ ...newType, description: e.target.value })}
          />
          <FileUploadButton
            color="info"
            variant="contained"
            text="Upload Image"
            onUpload={(name: string) => setNewType({ ...newType, imageUrl: name })}
          />
        </Stack>
        <Divider></Divider>
        {nameAlert && <Typography color={"error"} variant="body2">Name cannot be blank</Typography>}
        <Button onClick={handleEditSubmit} variant="contained" color="primary">{type ? "Save" : "Create"}</Button>
      </Stack>
    </PrettyModal>
  );
}