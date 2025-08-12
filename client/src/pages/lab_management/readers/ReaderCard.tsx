import {
  Autocomplete,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Link,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import { GET_CORRESPONDING_MACHINE_BY_READER_ID_OR_MACHINE_ID } from "../../../queries/equipmentQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import { useQuery, useMutation } from "@apollo/client";
import TimeAgo from 'react-timeago'
import { DELETE_READER, GET_AVAILABLE_FIRMWARE_VERSIONS, GET_MAKERSPACE_FOR_WELCOME_READER, GET_READERS, IDENTIFY_READER, Reader, REQUEST_OTA_UPDATE, SET_READER_STATE } from "../../../queries/readersQueries";
import LanIcon from '@mui/icons-material/Lan';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import HourglassFullIcon from '@mui/icons-material/HourglassFull';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ReportProblemIcon from '@mui/icons-material/ReportProblemSharp';
import StarsIcon from '@mui/icons-material/Stars';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { useState } from "react";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CloseIcon from '@mui/icons-material/Close';

interface ReaderCardProps {
  reader: Reader
  makerspaceID: string,
  searchQuery: string,
}



function shouldShowBasedOnSearchTerm(search: string, reader: Reader, pairedThing: string): boolean{
  const lowerSearch = search.toLocaleLowerCase();
  const lowerReader = reader.name.toLocaleLowerCase();
  const lowerPaired = pairedThing.toLocaleLowerCase();
  return lowerReader.includes(lowerSearch) || lowerPaired.includes(lowerSearch)
}

export default function ReaderCard({ reader, makerspaceID, searchQuery }: ReaderCardProps) {
  const theme = useTheme();

  const machineResult = useQuery(GET_CORRESPONDING_MACHINE_BY_READER_ID_OR_MACHINE_ID, {
    variables: { readerid: reader.id, id: reader.machineID }
  });
  const makerspaceResult = useQuery(GET_MAKERSPACE_FOR_WELCOME_READER, {
    variables: { readerId: reader.id },
  });
  const machine = machineResult?.data?.correspondingEquipment;
  const makerspace = makerspaceResult?.data?.makerspaceForWelcomeReader

  const pairedThing = (machine ? machine.name : makerspace ? makerspace.name : "");
  const shouldShow = shouldShowBasedOnSearchTerm(searchQuery, reader, pairedThing);

  const now = new Date();
  const lastTimeDifference = now.getTime() - (new Date(reader.lastStatusTime).getTime());
  const isOffline = lastTimeDifference > 30 * 1000;

  const [setReaderState] = useMutation(SET_READER_STATE);
  const [doIdentify] = useMutation(IDENTIFY_READER)
  const [identifying, setIdentifying] = useState<boolean>(false);
  const handleChange = (state: string) => {
    if (state === "Identify") {
      setIdentifying(!identifying);
      doIdentify({ variables: { "id": reader.id, doIdentify: identifying } })
    } else {
      setReaderState({ variables: { id: reader.id, state: state } });
    }
  };

  const [deleteReader] = useMutation(DELETE_READER, { refetchQueries: [{ query: GET_READERS }] })

  const [dialOpen, setDialOpen] = useState(false);
  


  function machineOrMakerspace() {
    if (machine) {
      const l = <Link href={"/app/admin/equipment/" + (machine.archived ? "/archived" : "") + (machine.id)}> {machine.name}</Link>
      return <span><b>Machine: </b> {l} </span>
    } else if (makerspace) {
      const l = <Link href={`/app/makerspace/${makerspace.id}`}>{makerspace.name}</Link>
      return <span><b>Welcome For: </b> {l} </span>
    } else {
      return <b>Not Paired with Machine or Makerspace</b>
    }
  }

  function lastStatusTime() {
    return <span style={{ fontWeight: isOffline ? 'bold' : 'regular', color: isOffline ? 'red' : 'inherit' }}>
      <TimeAgo date={reader.lastStatusTime} component={"span"} />
    </span>
  }

  function stateAndTemp() {

    return <Card variant="outlined"><CardContent>
      <Stack direction={"row"}>
        <Stack direction={"column"} justifyContent={"center"} width={"70%"} >
          State
          <Typography textAlign={"center"} variant={"h4"}>{reader.state}</Typography>
        </Stack>

        <Stack direction={"column"} justifyContent={"center"} width={"30%"} >
          <Typography textAlign={"right"}>Temp (&#176;C)</Typography>
          <Typography textAlign={"center"} variant={"h4"}>{Math.round(reader.temp)}</Typography>
        </Stack>
      </Stack>
    </CardContent></Card>;
  }


  function ShowVersions() {
    const labels = true ?
      ["Current SW", "Pending SW", "HW Version"]
      : ["BEVer", "FEVer", "HWVer"];
    const values = [reader.BEVer, reader.FEVer, reader.HWVer];


    return <Stack direction={"row"} justifyContent={"center"} spacing={1} paddingTop={"3px"} paddingBottom={"3px"}>
      <Stack direction={"column"}>
        {labels.map(l => <div><b>{l}: </b></div>)}
      </Stack>

      <Stack direction={"column"}>
        {values.map(v => <div>{(v !== '') ? v : "N/A"}</div>)}
      </Stack>
    </Stack>
  }

  const firmwareVersions = useQuery(GET_AVAILABLE_FIRMWARE_VERSIONS);

  function otaOptions(): string[] {
    const options = [];
    options.push("stable");
    options.push("no-ota");
    if (firmwareVersions.data) {
      options.push(...firmwareVersions.data.availableFirmwareVersions)
    }
    return options;
  }


  const [otaSelection, setOtaSelection] = useState<string>(reader.targetFirmwareVersion ?? "")
  const [requestOTA] = useMutation(REQUEST_OTA_UPDATE, { refetchQueries: [{ query: GET_READERS }] });

  function saveOTA(sendNow: boolean) {
    if (otaSelection === "no-ota") {
      sendNow = false; // this isnt a real tag so dont tell it to update rn
    }
    requestOTA({ variables: { ids: [reader.id], otaTag: otaSelection, updateNow: sendNow } });
  }

  function OTAControl() {

    return <Stack direction={"row"}>
      {firmwareVersions.loading ? <CircularProgress color="primary" size={"1em"} /> :
        <Autocomplete
          renderInput={(params: any) => <TextField {...params} label="OTA Target Version" />}
          size="small"
          options={otaOptions()}
          disableClearable
          onChange={(_, val) => setOtaSelection(val)}
          value={otaSelection}
          fullWidth
          loading={firmwareVersions.loading}
        />

      }
      <Tooltip title="Save">
        <IconButton sx={{ color: theme.palette.info.main }} onClick={() => saveOTA(false)}><SaveIcon /></IconButton>
      </Tooltip>
      <Tooltip title="Save and Update">
        <IconButton sx={{ color: theme.palette.success.main }} onClick={() => saveOTA(true)}><SendIcon /></IconButton>
      </Tooltip>
    </Stack>

  }

  function SendStateSpeedDial() {
    return <SpeedDial
      ariaLabel="Send State Speeddial"
      color="secondary"
      icon={<SpeedDialIcon icon={<MoreHorizIcon />} openIcon={<CloseIcon />} />}
      open={dialOpen}
      onClick={() => setDialOpen(!dialOpen)}
      sx={{ justifySelf: "right", position: "relative", paddingRight: "5px" }}
    >
      {[
        { name: "Idle", icon: <HourglassFullIcon color="warning" /> },
        { name: "Unlocked", icon: <LockOpenIcon color="success" /> },
        { name: "AlwaysOn", icon: <StarsIcon color="success" /> },
        { name: "Lockout", icon: <LockIcon color="error" /> },
        { name: "Fault", icon: <ReportProblemIcon color="error" /> },
        { name: "Restart", icon: <RestartAltIcon color="info" /> },
        { name: "Identify", icon: <FingerprintIcon color="info" /> }
      ].map((d, i) => {
        return <SpeedDialAction
          key={i}
          icon={d.icon}
          slotProps={{ tooltip: { title: d.name, open: true } }}
          sx={{ position: "absolute", bottom: `${(i + 1) * 50 + 20}px` }}
          onClick={() => handleChange(d.name)}
        ></SpeedDialAction>
      })}

    </SpeedDial>
  }

  return shouldShow ? (
    <RequestWrapper
      loading={machineResult.loading}
      error={machineResult.error}
    >
      <Card id={`id-${reader.id}`} sx={{ width: 350, margin: "10px", border: '2px solid ' + ((reader.state === "Fault") ? theme.palette.error.main : "#ffffff00") }} >
        <CardContent id={reader.name}>
          <Stack direction={"row"} justifyContent={"space-between"} paddingBottom={"5px"}>
            <Typography variant="h5">{reader.name}</Typography>

            <Button variant="contained" color="error" size="small" onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${reader.name}`)) {
                deleteReader({ variables: { id: reader.id } });
              }
            }}><DeleteIcon />
            </Button>
          </Stack>


          <Stack direction={"column"} fontSize={".9em"} paddingBottom={"2px"}>
            <span><b>SN:</b> {reader.SN}</span>
            <span><b>Reader ID: </b>{reader.id}</span>
            {machineOrMakerspace()}
            <span>Last Online: {lastStatusTime()}</span>
          </Stack>

          {stateAndTemp()}

          {ShowVersions()}

          {OTAControl()}


          <Stack direction={"row"} justifyContent={"space-between"} justifyItems={"center"} alignItems={"flex-end"}>
            <Button
              variant="contained"
              color="secondary"
              endIcon={<LanIcon />}
              onClick={() => alert("Uh, this button doesnt do anything?.....")}
            >
              Manage Switch(es)</Button>

            {SendStateSpeedDial()}
          </Stack>

        </CardContent>
      </Card>
    </RequestWrapper>
  ) : false;
}
