import { ChangeEvent, ChangeEventHandler, SyntheticEvent, useEffect, useState } from "react";
import { Autocomplete, Button, Divider, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import { useMutation, useQuery } from "@apollo/client";
import { GET_TRAINING_MODULES } from "../../../queries/trainingQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import GET_ROOMS from "../../../queries/roomQueries";
import { Equipment } from "./EditEquipmentPage";
import AttachedModule from "./AttachedModule";
import ArchiveEquipmentButton from "./ArchiveEquipmentButton";
import PublishEquipmentButton from "./PublishEquipmentButton";
import { ObjectSummary } from "../../../types/Common";
import AdminPage from "../../AdminPage";
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes';
import { CREATE_EQUIPMENT_INSTANCE } from "../../../queries/equipmentInstanceQueries";
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import IssueLogModal from "./IssueLogModal";
import PrettyModal from "../../../common/PrettyModal";
import InstanceGrid from "./InstanceGrid";

interface EquipmentEditorProps {
  newEquipment: boolean;
  equipment: Equipment;
  setEquipment: (equipment: Equipment) => void;
  onSave: () => void;
}

export default function EquipmentEditor({
  newEquipment,
  equipment,
  setEquipment,
  onSave,
}: EquipmentEditorProps) {
  const getRoomsResult = useQuery(GET_ROOMS);
  const getModulesResult = useQuery(GET_TRAINING_MODULES);

  const getModuleOptions = (): ObjectSummary[] => {
    if (!getModulesResult.data) return [];

    const attachedIDs = equipment.trainingModules.map((m) => m.id);

    return getModulesResult.data.modules.filter(
      (m: ObjectSummary) => !attachedIDs.includes(m.id)
    );
  };

  const handleNameChanged: ChangeEventHandler<HTMLInputElement> = (e) => {
    setEquipment({ ...equipment, name: e.target.value });
  };

  const handleRoomChanged = (e: SyntheticEvent, value: ObjectSummary | null) => {
    if (!value) return;
    setEquipment({
      ...equipment,
      room: value,
    });
  };

  const handleImageChanged = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEquipment({
      ...equipment,
      imageUrl: String(event.target.value),
    });
  };

  const handleSopChanged = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEquipment({
      ...equipment,
      sopUrl: String(event.target.value),
    });
  };

  const handleModuleAdded = (e: SyntheticEvent, value: ObjectSummary | null) => {
    if (!value) return;
    setEquipment({
      ...equipment,
      trainingModules: [...equipment.trainingModules, value],
    });
  };

  const handleModuleRemoved = (id: number) => () => {
    setEquipment({
      ...equipment,
      trainingModules: equipment.trainingModules.filter((e) => e.id !== id),
    });
  };

  const handleNotesChanged = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEquipment({
      ...equipment,
      notes: String(event.target.value),
    });
  };

  const handleByReservationOnlySwitchChanged = () => {
    setEquipment({
      ...equipment,
      byReservationOnly: !equipment.byReservationOnly
    });
  };

  const handleNeedsWelcomeSwitchChanged = () => {
    setEquipment({
      ...equipment,
      needsWelcome: !equipment.needsWelcome
    });
  };

  const handleRequiresTrainerApprovalSwitchChanged = () => {
    setEquipment({
      ...equipment,
      requiresTrainerApproval: !equipment.requiresTrainerApproval
    })
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

  const isMobile = width <= 1100;

  const [issuesModal, setIssuesModal] = useState(false);
  const [newInstanceModal, setNewInstanceModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [createInstance] = useMutation(CREATE_EQUIPMENT_INSTANCE);

  function handleCloseNewInstance() {
    setNewInstanceModal(false);
    setNewInstanceName("");
  }

  async function handleSubmitNewInsatance() {
    setNewInstanceModal(false)
    await createInstance({variables: {equipmentID: equipment.id, name: newInstanceName}})
    window.location.reload()
  }

  return (
    <RequestWrapper
      loading={getRoomsResult.loading || getModulesResult.loading}
      error={getRoomsResult.error || getModulesResult.error}
    >
      <AdminPage>
        <Stack padding="15px">
          <Stack direction={isMobile ? "column" : "row"} justifyContent="space-between" alignItems="baseline">
            {/* Title & Header buttons */}
            <Typography variant="h3">{`${newEquipment ? "Create New" : "Manage"} Equipment`}</Typography>
            {
              !newEquipment
              ? <Stack direction="row" spacing={1}>
                {
                  equipment.id ?
                    equipment.archived
                      ? <PublishEquipmentButton equipmentID={equipment.id} appearance="medium" /> 
                      : <ArchiveEquipmentButton equipmentID={equipment.id} appearance="medium" />
                    : null
                }
                {equipment.id && <Button variant="outlined" color="secondary" startIcon={<SpeakerNotesIcon />} onClick={() => setIssuesModal(true)}>
                  View Issue Logs
                </Button>}
              </Stack>
              : null
            }
          </Stack>
          { // Instances
            newEquipment
            ? null
            : <Stack>
                <Stack direction="row" spacing={2} alignItems="center" padding="10px">
                  <Typography variant="h5">Instances</Typography>
                  <Button variant="contained" startIcon={<AddIcon/>} color="success" onClick={() => {setNewInstanceModal(true)}}>
                    Create New Instance
                  </Button>
                </Stack>
                <PrettyModal open={newInstanceModal} onClose={handleCloseNewInstance}>
                  <Stack width="auto" spacing={2}>
                    <Typography variant="h4">Create New Instance</Typography>
                    <TextField
                      label="Name"
                      value={newInstanceName}
                      onChange={(e) => setNewInstanceName(e.target.value)}
                    />
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={handleCloseNewInstance}
                      >
                        Cancel
                      </Button>
                      <Button variant="contained" color="success" onClick={handleSubmitNewInsatance}>Submit</Button>
                    </Stack>
                  </Stack>
                </PrettyModal>
                <InstanceGrid equipmentID={equipment.id ?? 0} isMobile={isMobile}/>
              </Stack>
          }
          
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            width="auto"
            padding="0px 10px"
          >
            <Stack spacing={2} width={isMobile ? "100%" : "50%"}>
              <Typography variant="h5">Machine Information</Typography>
              <TextField
                label="Name"
                value={equipment.name}
                onChange={handleNameChanged}
                inputProps={{
                  maxLength: 50
                }}
              />
              <TextField
                label="Image URL"
                value={equipment.imageUrl}
                onChange={handleImageChanged}
              />
              <TextField
                label="SOP URL"
                value={equipment.sopUrl}
                onChange={handleSopChanged}
              />
              <Autocomplete
                renderInput={(params: any) => (
                  <TextField {...params} label="Location" />
                )}
                /* Autocomplete's value prop wants undefined, not null.
                * But if we give it undefined then it thinks it's an
                * uncontrolled prop and throws a console error
                * when we set the value. This is a MUI problem.
                * @ts-ignore */
                value={equipment.room}
                options={getRoomsResult.data?.rooms ?? []}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => option.name}
                onChange={handleRoomChanged}
                disableClearable
              />
              <TextField
                label="Description"
                style={{background: "none", fontFamily: "Roboto", fontSize: "1em", lineHeight: "2em"}}
                aria-label="Description" 
                defaultValue={equipment.notes} 
                placeholder="Description (Markdown Compatible)"
                onChange={handleNotesChanged}
                rows={3}
              />

              <FormControlLabel control={<Switch checked={equipment.byReservationOnly} onChange={handleByReservationOnlySwitchChanged} />} label={"Available by reservation only"} />
              <FormControlLabel control={<Switch checked={equipment.needsWelcome} onChange={handleNeedsWelcomeSwitchChanged} />} label={"Needs Welcome"} />
              <FormControlLabel control={<Switch checked={equipment.requiresTrainerApproval} onChange={handleRequiresTrainerApprovalSwitchChanged} />} label={"Requires Trainer to Approve"} />
              
              <Typography variant="h5">Training Modules</Typography>
              <Stack divider={<Divider flexItem />} spacing={1}>
                {equipment.trainingModules.map((m) => (
                  <AttachedModule
                    module={m}
                    key={m.id}
                    onRemove={handleModuleRemoved(m.id)}
                  />
                ))}
              </Stack>
              <Autocomplete
                key={equipment.trainingModules.length}
                renderOption={(params, module) => (
                  <li {...params} key={module.id}>
                    {module.name}
                  </li>
                )}
                renderInput={(params: any) => (
                  <TextField {...params} label="Attach module" key={module.id} />
                )}
                options={getModuleOptions()}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => option.name}
                onChange={handleModuleAdded}
              />

              <Button
                variant="contained"
                size="large"
                sx={{ mt: 4, alignSelf: "flex-end" }}
                onClick={onSave}
                color="success"
                startIcon={<SaveIcon />}
              >
                Save
              </Button>
            </Stack>
            <Stack width={isMobile ? "100%" : "50%"} spacing={2}>
              <Stack direction="row" alignItems="center" spacing={4}>
                
              </Stack>
            </Stack>
          </Stack>
        </Stack>
        <IssueLogModal equipmentID={equipment.id + ""} open={issuesModal} onClose={() => setIssuesModal(false)} />
      </AdminPage>
    </RequestWrapper>
  );
}
