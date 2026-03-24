import { useMutation, useQuery } from "@apollo/client";
import { GET_UNPAIRED_READERS, GET_WELCOME_READERS_FOR_MAKERSPACE, PAIR_AS_WELCOME_READER, Reader, UNPAIR_AS_WELCOME_READER } from "../../queries/readersQueries";
import { useState } from "react";
import RequestWrapper from "../../common/RequestWrapper";
import { Box, Stack } from "@mui/system";
import { Alert, Autocomplete, Button, Card, CardContent, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AddLinkIcon from '@mui/icons-material/AddLink';
import AuditLogEntity from "../lab_management/audit_logs/AuditLogEntity";


export default function ManageWelcomReadersCard({ makerspaceId }: { makerspaceId: number }) {
    const unpairedReaderResult = useQuery(GET_UNPAIRED_READERS)
    const [reader, setReader] = useState<{ id: number, name: string } | null>(null);

    const pairedWelcomeReaderResult = useQuery(GET_WELCOME_READERS_FOR_MAKERSPACE, { variables: { makerspaceId: makerspaceId } });


    const unpairedReaders: Reader[] | null = unpairedReaderResult?.data?.unpairedReaders;
    const pairedReaders: Reader[] | null = pairedWelcomeReaderResult?.data?.welcomeReadersForMakerspace;

    const [unpairWelcomeReader] = useMutation(UNPAIR_AS_WELCOME_READER, { refetchQueries: [{ query: GET_UNPAIRED_READERS, }, { query: GET_WELCOME_READERS_FOR_MAKERSPACE, variables: { makerspaceId: makerspaceId } }] });
    function unpairReader(id: number) {
        unpairWelcomeReader({ variables: { readerId: id, makerspaceId: makerspaceId } });
    }

    const [pairWelcomeReader] = useMutation(PAIR_AS_WELCOME_READER, { refetchQueries: [{ query: GET_UNPAIRED_READERS }, { query: GET_WELCOME_READERS_FOR_MAKERSPACE, variables: { makerspaceId: makerspaceId } }] });
    function pairReader() {
        if (reader == null) {
            return;
        }
        pairWelcomeReader({ variables: { readerId: reader?.id, makerspaceId: makerspaceId } });
        setReader(null);
    }

    function generateDropdownOptions(): { id: number | undefined, name: string }[] {
        let options: { id: number | undefined, name: string }[] = [];

        if (unpairedReaders) {
            const asOptions = unpairedReaders.map((reader: Reader) => ({ id: reader.id, name: reader.name }));
            options.push(...asOptions);
        }
        return options;
    }

    return <Box>
        <RequestWrapper loading={unpairedReaderResult.loading || pairedWelcomeReaderResult.loading} error={unpairedReaderResult.error || pairedWelcomeReaderResult.error}>
            <Stack spacing={2}>
                <Typography variant="h5" fontWeight={"bold"}>Welcome Readers</Typography>
                <Stack direction={"column"} spacing={2}>
                    {
                        (pairedReaders && pairedReaders.length > 0) ?
                            (pairedReaders.map((reader: Reader) => {
                                return <Card>
                                    <CardContent>
                                        <Stack direction={"row"} spacing={1} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Typography variant="h6" component="div">
                                                <AuditLogEntity entityCode={`access_device:${reader.id}:${reader.name}`} />
                                            </Typography>
                                            <Stack direction={"row"} alignItems={"center"}>
                                                <Typography variant="body2">
                                                    {"ID " + reader.id}
                                                </Typography>
                                                <Tooltip title="Unpair as Welcome Reader">
                                                    <IconButton onClick={() => { unpairReader(reader.id) }} color={"error"}><LinkOffIcon /></IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            }))
                            : <Alert severity="warning" variant="filled">No Welcome Readers Paired</Alert>

                    }
                </Stack>
                <Stack direction={"row"} width={"100%"} justifyContent={"space-between"} spacing={2}>
                    <Autocomplete
                        renderInput={
                            (params: any) => <TextField {...params} label="Slug" />
                        }
                        getOptionLabel={(option) => option.name}
                        size="small"
                        options={generateDropdownOptions()}
                        onChange={(_, value) => setReader(value.id != null ? { id: value.id, name: value.name } : null)}
                        disableClearable
                        defaultValue={reader ?? { id: undefined, name: "No Reader" }}
                        fullWidth
                    />
                    <Button startIcon={<AddLinkIcon />} onClick={pairReader} disabled={reader == null} variant="contained">Pair</Button>
                </Stack>
            </Stack>

        </RequestWrapper>

    </Box>

} 