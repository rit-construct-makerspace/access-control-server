import { Autocomplete, Divider, Stack, TextField, Typography } from "@mui/material";
import AttachedModule from "../../../common/AttachedModule";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { ObjectSummary } from "../../../types/Common";
import GET_TRAINING_MODULES from "../../../queries/trainingQueries";
import { useQuery } from "@apollo/client/react";

interface EquipmentTrainingProps {
  equipmentID: number;
  equipmentModules: ObjectSummary[];
  addModule: (mID: number) => void;
  removeModule: (mID: number) => void;
}

export default function EquipmentTrainings(props: EquipmentTrainingProps) {
  const getModulesResult = useQuery(GET_TRAINING_MODULES);

  return (
    <RequestWrapper2 result={getModulesResult} render={(data) => {

      const possibleModules = data.modules.filter((m: ObjectSummary) => (
        (!props.equipmentModules.some((eMod) => m.id === eMod.id) && !m.archived) // TODO: filter to this makerspace's + global trainings
      ));

      return (
        <Stack>
          <Typography variant="h6">Training Modules</Typography>
          <Stack divider={<Divider flexItem />} spacing={1}>
            {props.equipmentModules.map((m) => (
              <AttachedModule
                module={m}
                key={m.id}
                onRemove={() => props.removeModule(m.id)}
              />
            ))}
          </Stack>
          <Autocomplete
            renderOption={(params, module: ObjectSummary) => (
              <li {...params} key={module.id}>
                {module.name}
              </li>
            )}
            renderInput={(params: any) => (
              <TextField {...params} label="Attach module" />
            )}
            options={possibleModules}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => option.name}
            onChange={(e, value) => { if (value) { props.addModule(value.id) } }}
          />
        </Stack>
      );
    }} />
  );
}