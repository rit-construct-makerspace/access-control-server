import { useMutation, useQuery } from "@apollo/client";
import { GET_UNPAIRED_READERS, GET_WELCOME_READERS_FOR_MAKERSPACE, PAIR_AS_WELCOME_READER, Reader, UNPAIR_AS_WELCOME_READER } from "../../queries/readersQueries";
import { useState } from "react";
import RequestWrapper from "../../common/RequestWrapper";
import { Box, Stack } from "@mui/system";
import { Alert, Autocomplete, Button, Card, CardContent, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AddLinkIcon from '@mui/icons-material/AddLink';
import AuditLogEntity from "../lab_management/audit_logs/AuditLogEntity";
import { Core, GET_PAIRED_WELCOME_CORES, GET_UNPAIRED_CORES } from "../../queries/deviceQueries";


export default function ManageWelcomReadersCard({ makerspaceId }: { makerspaceId: number }) {
  const [device, setDevice] = useState<{ id: number, name: string } | null>(null);

  const unpairedCoreResult = useQuery(GET_UNPAIRED_CORES, { variables: { makerspaceID: makerspaceId } });
  const pairedWelcomeCoreResult = useQuery(GET_PAIRED_WELCOME_CORES, { variables: { makerspaceID: makerspaceId } });


  const unpairedCores: Core[] | null = unpairedCoreResult.data?.getUnpairedCores;
  const pairedCores: Core[] | null = pairedWelcomeCoreResult.data?.getPairedWelcomeCores;

  const [unpairWelcomeReader] = useMutation(UNPAIR_AS_WELCOME_READER, { refetchQueries: [{ query: GET_UNPAIRED_READERS, }, { query: GET_WELCOME_READERS_FOR_MAKERSPACE, variables: { makerspaceId: makerspaceId } }] });
  function unpairReader(id: number) {
    unpairWelcomeReader({ variables: { readerId: id, makerspaceId: makerspaceId } });
  }

  const [pairWelcomeReader] = useMutation(PAIR_AS_WELCOME_READER, { refetchQueries: [{ query: GET_UNPAIRED_READERS }, { query: GET_WELCOME_READERS_FOR_MAKERSPACE, variables: { makerspaceId: makerspaceId } }] });
  function pairReader() {
    if (device == null) {
      return;
    }
    pairWelcomeReader({ variables: { readerId: device?.id, makerspaceId: makerspaceId } });
    setDevice(null);
  }

  function generateDropdownOptions(): { id: number | undefined, name: string }[] {
    const options: { id: number | undefined, name: string }[] = [];

    if (unpairedCores) {
      const asOptions = unpairedCores.map((core: Core) => ({ id: core.device.id, name: core.device.name }));
      options.push(...asOptions);
    }
    return options;
  }

  return <Box>
    <RequestWrapper loading={unpairedCoreResult.loading || pairedWelcomeCoreResult.loading} error={unpairedCoreResult.error || pairedWelcomeCoreResult.error}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={"bold"}>Welcome Devices</Typography>
        <Stack direction={"column"} spacing={2}>
          {
            (pairedCores && pairedCores.length > 0) ?
              (pairedCores.map((core: Core) => {
                return <Card>
                  <Stack
                    direction={"row"}
                    spacing={1}
                    padding={"10px 20px"}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <Typography variant="subtitle1" component="div">
                      <AuditLogEntity entityCode={`device:${core.device.id}:${core.device.name}`} />
                    </Typography>
                    <Stack direction={"row"} alignItems={"center"}>
                      <Typography variant="body2">
                        {"ID " + core.device.id}
                      </Typography>
                      <Tooltip title="Unpair as Welcome Reader">
                        <IconButton onClick={() => { unpairReader(core.device.id) }} color={"error"}><LinkOffIcon /></IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Card>
              }))
              : <Alert severity="warning" variant="filled">No Welcome Devices Paired</Alert>

          }
        </Stack>
        <Stack direction={"row"} width={"100%"} justifyContent={"space-between"} spacing={2}>
          <Autocomplete
            renderInput={
              (params: any) => <TextField {...params} label="Device" />
            }
            getOptionLabel={(option) => option.name}
            options={generateDropdownOptions()}
            onChange={(_, value) => setDevice(value.id != null ? { id: value.id, name: value.name } : null)}
            disableClearable
            defaultValue={device ?? { id: undefined, name: "No Device" }}
            fullWidth
          />
          <Button startIcon={<AddLinkIcon />} onClick={pairReader} disabled={device == null} variant="contained">Pair</Button>
        </Stack>
      </Stack>

    </RequestWrapper>

  </Box>

} 