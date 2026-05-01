import { Autocomplete, Button, Card, Chip, IconButton, Link, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { DELETE_EQUIPMENT_INSTANCE, EquipmentInstance, InstanceStatus, UPDATE_INSTANCE, UPDATE_INSTANCE_CONTROLLER_ASSIGNMENT } from "../../../queries/equipmentInstanceQueries";
import ActionButton from "../../../common/ActionButton";
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import BlockIcon from '@mui/icons-material/Block';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import AuditLogEntity from "../../lab_management/audit_logs/AuditLogEntity";
import { AccessController, AccessControllerState, COMMAND_CONTROLLER_STATE, GET_UNPAIRED_ACCESS_CONTROLLERS } from "../../../queries/deviceQueries";
import { useParams } from "react-router-dom";

interface EquipmentInstanceCardProps {
  instance: EquipmentInstance;
}

export default function EquipmentInstanceCard(props: EquipmentInstanceCardProps) {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const getUnpairedControllersResult = useQuery(GET_UNPAIRED_ACCESS_CONTROLLERS, { variables: { makerspaceID: Number(makerspaceID) } });

  const [deleteInstance] = useMutation(DELETE_EQUIPMENT_INSTANCE, {
    refetchQueries: ["EquipmentInstances", "GetUnpairedReaders"]
  });

  const [updateInstance] = useMutation(UPDATE_INSTANCE, {
    refetchQueries: ["EquipmentInstances", "GetUnpairedAccessControllers"],
    awaitRefetchQueries: true
  });

  const [updatePairing] = useMutation(UPDATE_INSTANCE_CONTROLLER_ASSIGNMENT, {
    refetchQueries: ["EquipmentInstances", "GetUnpairedAccessControllers"],
    awaitRefetchQueries: true
  })


  const [allowEdit, setAllowEdit] = useState(false);
  const [name, setName] = useState<string>(props.instance.name);
  const [status, setStatus] = useState<InstanceStatus>(props.instance.status);
  const [pairedController, setPairedController] = useState<AccessController | undefined>(props.instance.accessController);

  const currentAccessController: AccessController | undefined = props.instance.accessController;
  const unpairedAccessControllers: AccessController[] | [] = getUnpairedControllersResult.data?.getUnpairedAccessControllers ?? [];


  const [sendCommandedState] = useMutation(COMMAND_CONTROLLER_STATE);
  const [commandedState, setCommandedState] = useState<string>("IDLE");


  async function handleSave() {
    setAllowEdit(false);
    await updateInstance({ variables: { id: props.instance.id, name: name, status: status } })
    await updatePairing({ variables: { id: Number(props.instance.id), accessControllerID: pairedController?.id } })
  }

  async function handleCancel() {
    setAllowEdit(false);
    setName(props.instance.name);
    setStatus(props.instance.status);
    setPairedController(props.instance.accessController);
  }

  function handleStateChange(e: any) {
    setCommandedState(e.target.value);
  }

  function setStateClicked(_e: any) {
    if (props.instance.accessController != null) {
      sendCommandedState({ variables: { accessControllerID: props.instance.accessController.id, targetState: commandedState } });
    }
  }

  async function handleDeleteInstance() {
    await deleteInstance({ variables: { id: props.instance.id } });
  }

  function controllerPairingField() {

    return <Autocomplete
      key={props.instance.id}
      renderInput={(params) => <TextField
        {...params}
        label={"Controller Pairing"}
      />}
      fullWidth
      options={props.instance.accessController ? [props.instance.accessController, ...unpairedAccessControllers] : unpairedAccessControllers}
      getOptionLabel={(controller) => `${controller.device.name}:${controller.channelID}`}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      onChange={(_e, newValue) => setPairedController(newValue ?? undefined)}
      value={pairedController}
    />;
  }

  function activeUserDisplay() {
    if (!currentAccessController) {
      return <Typography>No User</Typography>;
    }
    if (!currentAccessController.core?.activeUser) {
      if (currentAccessController.state === AccessControllerState.ALWAYS_ON || currentAccessController.state === AccessControllerState.UNLOCKED) {
        return <Typography>Unlocked with no user</Typography>;
      } else {
        return <Typography>No User</Typography>;
      }
    }
    return <Stack direction={"row"}>
      User:&nbsp;
      <AuditLogEntity entityCode={`user:${currentAccessController.core?.activeUser.id}:${currentAccessController.core?.activeUser?.firstName} ${currentAccessController.core?.activeUser?.lastName}`} />
    </Stack>
  }

  return (
    <Card sx={{ padding: "15px" }} >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent={"space-between"}>
          {
            !allowEdit
              ? <Typography variant="h6" fontWeight={"bold"}>{props.instance.name}</Typography>
              : <TextField size="small" value={name} onChange={(e) => setName(e.target.value)}></TextField>
          }
          {
            !allowEdit
              ? <>
                <ActionButton iconSize={20} color={"primary"} appearance={"icon-only"} tooltipText="Edit" handleClick={async () => { setPairedController(props.instance.accessController); setAllowEdit(true); }}
                  loading={false}><DriveFileRenameOutlineIcon /></ActionButton>
              </>
              : <>
                <ActionButton iconSize={20} color={"error"} appearance={"icon-only"} tooltipText="Cancel" handleClick={handleCancel}
                  loading={false}><BlockIcon /></ActionButton>
              </>
          }
        </Stack>
        <Stack alignItems={"center"} spacing={1}>
          {
            !allowEdit
              ? currentAccessController
                ? <Link href={`/app/makerspace/${currentAccessController?.device.makerspaceID}/devices?q=${currentAccessController?.device.name}`}>{`${currentAccessController?.device.name}:${currentAccessController?.channelID}`}</Link>
                : <Typography>Unpaired</Typography>
              : controllerPairingField()
          }
          {activeUserDisplay()}
          <Stack direction={"row"} spacing={2} alignItems={"center"}>
            <Typography>Current State:</Typography>
            <Chip
              label={currentAccessController?.state ?? "NONE"}
              color={currentAccessController?.state === undefined ? "info"
                : currentAccessController.state === AccessControllerState.IDLE ? "warning"
                  : currentAccessController.state === AccessControllerState.UNLOCKED ? "success"
                    : currentAccessController.state === AccessControllerState.LOCKED_OUT || currentAccessController.state === AccessControllerState.FAULT ? "error"
                      : currentAccessController.state === AccessControllerState.ALWAYS_ON ? "success"
                        : "info"
              }
            />
          </Stack>
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems={"center"} spacing={1}>
          <Select disabled={allowEdit || currentAccessController === undefined} size="small" defaultValue={currentAccessController?.state ?? AccessControllerState.IDLE} value={commandedState} onChange={handleStateChange} fullWidth>
            <MenuItem value={AccessControllerState.IDLE}>Idle</MenuItem>
            <MenuItem value={AccessControllerState.LOCKED_OUT}>Locked Out</MenuItem>
            <MenuItem value={AccessControllerState.ALWAYS_ON}>Always On</MenuItem>
          </Select>
          <IconButton disabled={allowEdit || currentAccessController === undefined} onClick={setStateClicked} color="secondary">
            <SendIcon />
          </IconButton>
        </Stack>
        {
          allowEdit
            ? <Stack direction="row" justifyContent="space-between">
              <Button color="error" variant="contained" startIcon={<DeleteIcon />} onClick={handleDeleteInstance}>Delete</Button>
              <Button color="success" variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
            </Stack>
            : undefined
        }
      </Stack>
    </Card >
  );
}