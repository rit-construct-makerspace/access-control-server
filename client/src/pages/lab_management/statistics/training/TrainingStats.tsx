import { useLazyQuery, useQuery } from "@apollo/client";
import { Badge, Box, Button, Card, Collapse, CollapseProps, FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, styled, TextField, Tooltip, Typography } from "@mui/material";
import gql from "graphql-tag";
import { ReactElement, useEffect, useState } from "react";
import PageSectionHeader from "../../../../common/PageSectionHeader";
import RequestWrapper from "../../../../common/RequestWrapper";
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import RequestWrapper2 from "../../../../common/RequestWrapper2";
import AuditLogEntity from "../../audit_logs/AuditLogEntity";
import { format } from "date-fns";
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GET_TRAINING_MODULES from "../../../../queries/trainingQueries";
import { TrainingModule } from "../../../../types/TrainingModule";
import { TrainingStatCard } from "./TrainingStatCard";

const GET_VERBOSE_TRAINING_SUBMISSIONS = gql`
  query GetTrainingSubmissionsWithAttachedEntities($startDate: String, $endDate: String, $moduleIDs: [String]) {
    getTrainingSubmissionsWithAttachedEntities(startDate: $startDate, endDate: $endDate, moduleIDs: $moduleIDs) {
      id
      moduleID
      moduleName
      quiz
      makerID
      makerName
      summary
      submissionDate
      passed
      expirationDate
    }
  }
`;

export interface VerboseTrainingSubmission {
  id: number;
  moduleID: number;
  quiz: { id: string, type: string, text: string }[];
  makerID: number;
  summary: {questionNum: string, questionText: string, correct: boolean}[];
  submissionDate: Date;
  passed: boolean;
  expirationDate: Date;
  moduleName: string;
  makerName: string;
}


function joinTrainingSubmission(obj: VerboseTrainingSubmission) {
  return (obj.id + ', ' + obj.moduleID + ', ' + obj.moduleName + ', ' + obj.makerID + ', ' + obj.makerName + ', ' + obj.submissionDate + ', '
    + obj.passed + ', ' + obj.summary);
}

const FailedQuestionCard = (props: { question: string }) => (
  <Card>
    <Typography fontSize={10}>{props.question}</Typography>
  </Card>
)


export function TrainingStats() {
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

  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [moduleIDs, setModuleIDs] = useState<number[]>([]);

  const [showClearButton, setShowClearButton] = useState<boolean>(false);
  const [cardContainerCollapsed, setCardContainerCollapsed] = useState<boolean>(true);

  const [getTrainingSubmissions, getTrainingSubmissionsResult] = useLazyQuery(GET_VERBOSE_TRAINING_SUBMISSIONS);

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setStartDate(e.target.value)
    if (startDate && startDate != "") setShowClearButton(true);
  }

  function handleEndDateChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEndDate(e.target.value)
    if (endDate && endDate != "") setShowClearButton(true);
  }

  function handleModuleIDsChange(e: SelectChangeEvent<number[]>) {
    setModuleIDs((e.target.value as number[]));
    if (moduleIDs && moduleIDs.length > 0) setShowClearButton(true);
  }

  function handleClear() {
    setStartDate("");
    setEndDate("");
    setModuleIDs([]);
    setShowClearButton(false);
  }

  function handleSubmit() {
    var variables = {
      ...(startDate && startDate != "" && { startDate }),
      ...(endDate && endDate != "" && { endDate }),
      ...(moduleIDs && moduleIDs.length > 0 && { moduleIDs: moduleIDs })
    };
    getTrainingSubmissions({ variables });
  }


  const download = (data: BlobPart, name: string) => {
    // Create a Blob with the CSV data and type
    const blob = new Blob([data], { type: 'text/csv' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create an anchor tag for downloading
    const a = document.createElement('a');

    // Set the URL and download attribute of the anchor tag
    a.href = url;
    a.download = name;

    // Trigger the download by clicking the anchor tag
    a.click();
  }

  function handleCSVExport() {
    let csvContent =
      Object.keys(getTrainingSubmissionsResult.data.getTrainingSubmissionsWithAttachedEntities[0] as VerboseTrainingSubmission).map((s: string) => s == "__typename" ? '' : `${s},`).join('')
      + '\n' + getTrainingSubmissionsResult.data.getTrainingSubmissionsWithAttachedEntities.map((e: VerboseTrainingSubmission) => joinTrainingSubmission(e)).join("\n");
    download(csvContent, "trainingSubmissions.csv");
  }

  function groupByModuleID(sessions: VerboseTrainingSubmission[]): Record<string, VerboseTrainingSubmission[]> {
    return sessions.reduce((acc, session) => {
      if (!acc[session.moduleID]) {
        acc[session.moduleID] = [];
      }
      acc[session.moduleID].push(session);
      return acc;
    }, {} as Record<string, VerboseTrainingSubmission[]>);
  };





  //Dropdown query
  const getModules = useQuery(GET_TRAINING_MODULES);

  return (
    <Box width={"100%"}>
      <PageSectionHeader>Training Submissions</PageSectionHeader>

      <Stack direction={isMobile ? "column" : "row"} spacing={2}>
        <FormControl>
          <TextField
            label="Start"
            type="date"
            sx={{ width: 180 }}
            value={startDate}
            onChange={handleStartDateChange}
            focused
          />
        </FormControl>
        <FormControl>
          <TextField
            label="Stop"
            type="date"
            sx={{ width: 180 }}
            value={endDate}
            onChange={handleEndDateChange}
            focused
          />
        </FormControl>


        <RequestWrapper loading={getModules.loading} error={getModules.error}>
          <FormControl sx={{ width: '25em' }}>
            <InputLabel id="es-stat_equipment-select_label">Modules (Default is all)</InputLabel>
            <Select
              labelId="es-stat_equipment-select_label"
              value={moduleIDs}
              label="Equipment"
              multiple
              onChange={handleModuleIDsChange}
            >
              {getModules.data?.modules.map((module: TrainingModule) => (
                <MenuItem value={module.id}>{module.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </RequestWrapper>

        <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ width: '10em' }}>Fetch</Button>

        <Tooltip title={getTrainingSubmissionsResult.data ? "Maker and Module columns will be split into Names and IDs" : "Must Fetch data before exporting"}>
          <Button onClick={handleCSVExport} startIcon={<DownloadIcon />} variant="outlined" color="secondary" sx={{ width: '10em' }} disabled={!getTrainingSubmissionsResult.data}>Export as CSV</Button>
        </Tooltip>

        {showClearButton && (
          <IconButton onClick={handleClear} sx={{ ml: "8px !important" }}>
            <CloseIcon />
          </IconButton>
        )}
      </Stack>

      <Box sx={{ width: '100%' }}>
        <RequestWrapper2 result={getTrainingSubmissionsResult} render={function (data: any): ReactElement {
          const rows = data.getTrainingSubmissionsWithAttachedEntities;

          const columns: GridColDef<(typeof rows)[number]>[] = [
            {
              field: 'id',
              headerName: 'ID',
              width: 90
            },
            {
              field: 'module',
              headerName: 'Module',
              width: 270,
              valueGetter: (value, row) => (`${row.moduleName} (${row.moduleID})`),
              renderCell: (params) => (<AuditLogEntity entityCode={`module:${params.row.moduleID}:${params.row.moduleName}`} />)
            },
            {
              field: 'maker',
              headerName: 'User',
              width: 180,
              valueGetter: (value, row) => (`${row.makerName} (${row.makerID})`),
              renderCell: (params) => (<AuditLogEntity entityCode={`user:${params.row.makerID}:${params.row.makerName}`} />),
            },
            {
              field: 'submissionDate',
              headerName: 'Submission',
              width: 160,
              valueGetter: (value) => format(new Date(value), "M/d/yy h:mmaaa")
            },
            {
              field: 'passed',
              headerName: 'Passed',
              width: 50,
              valueGetter: (value: boolean) => value ? "Yes" : "No",
              //renderCell: (params) => (params.row.passed ? <Badge color="success"><div></div></Badge> : <Badge color="error"><div></div></Badge>)
            },
            {
              field: 'summary',
              headerName: 'Incorrect Questions',
              width: 700,
              renderCell: (params) => (
                <Stack direction={"column"} sx={{overflowY: "scroll"}} height={"3.3em"}>
                  {params.row.summary.filter(((questionSummary: {correct: boolean}) => !questionSummary.correct)).map((questionSummary: {questionText: string}) => (
                    <FailedQuestionCard question={questionSummary.questionText} />
                  ))}
                </Stack>
              )
            },
          ];

          const groupedRows = groupByModuleID(rows);

          return (

            <Box height={"auto"}>
              <DataGrid
                rows={rows}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 5,
                    },
                  },
                }}
                pageSizeOptions={[5]}
                //checkboxSelection
                disableRowSelectionOnClick
              />

              <Box width={"100%"}   overflow={"scroll"}>
                <IconButton sx={{ width: "100%", borderRadius: 0 }} onClick={() => setCardContainerCollapsed(!cardContainerCollapsed)}>
                  {cardContainerCollapsed ? "Show Cards" : "Hide Cards"}
                  {cardContainerCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
                <Collapse in={!cardContainerCollapsed}>
                  <Stack direction={"row"} flexWrap={"wrap"} justifyContent={"center"} alignItems={"center"}>
                    {Object.keys(groupedRows).map((key) => (
                      <TrainingStatCard relevantTrainingSubmissions={groupedRows[key]} />
                    ))}
                  </Stack>
                </Collapse>
              </Box>
            </Box>
          )
        }} />
      </Box>
    </Box>
  )
}