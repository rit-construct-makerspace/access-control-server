import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Link,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { GET_CORRESPONDING_MACHINE_BY_READER_ID_OR_MACHINE_ID } from "../../../queries/equipmentQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import AuditLogEntity from "../audit_logs/AuditLogEntity";
import { useQuery, useMutation } from "@apollo/client";
import TimeAgo from 'react-timeago'
import { IDENTIFY_READER, Reader, SET_READER_STATE } from "../../../queries/readersQueries";

interface ReaderCardProps {
    reader: Reader
    makerspaceID: string,
}



const styles = {
  errorText: {
    color: "red",
    fontWeight: "bold"
  },
  errorCard: {
    border: "3px solid red"
  },
  notifCard: {
    border: "3px solid blue"
  }
};

const nullUser = {
  id: null,
  firstName: null,
  lastname: ""
}

export default function ReaderCard({reader, makerspaceID}: ReaderCardProps) {
  const readerUser = reader.user ?? nullUser

  const stateContent = reader.state === "Active" ? (
    <p>Current User: <AuditLogEntity entityCode={`user:${readerUser.id}:${readerUser.firstName} ${readerUser.lastName}`}></AuditLogEntity><br></br>Session Length: {reader.recentSessionLength} sec</p>
  ) : (
    <p>Last User: {readerUser.id != null ? (<AuditLogEntity entityCode={`user:${readerUser.id}:${readerUser.firstName} ${readerUser.lastName}`}></AuditLogEntity>) : "NULL"}<br></br>Session Length: {reader.recentSessionLength} sec</p>
  );
  
  const machineResult = useQuery(GET_CORRESPONDING_MACHINE_BY_READER_ID_OR_MACHINE_ID, {
      variables: {readerid: reader.id, id: reader.machineID }
    });
  const machine = machineResult?.data?.correspondingEquipment;
    
  const now = new Date();
  const lastTimeDifference = now.getTime() - (new Date(reader.lastStatusTime).getTime());

  const [setReaderState]= useMutation(SET_READER_STATE);
  const handleChange = (event: any) => {
    // If the value was the informational one, ignore it
    if (event.target.value === "State"){
      return;
    }
    setReaderState({variables: {id: reader.id, state: event.target.value}});
  };

  const [doIdentify] = useMutation(IDENTIFY_READER)
  function handleIdentifyChecked(checked: boolean) {
    doIdentify({ variables: { "id": reader.id, doIdentify: checked } })

  }

  return (
    <RequestWrapper
    loading={machineResult.loading}
    error={machineResult.error}
    >
      <Card sx={{ width: 350, minHeight: 600, border: (reader.lastStatusReason == "Error" || reader.lastStatusReason == "Temperature" ? styles.errorCard : reader.helpRequested ? styles.notifCard : "")}}>
        <CardHeader
          title={reader.name}
          subheader={`SN: ${reader.SN}`}
        >
        </CardHeader>
        <CardContent>
          <Typography
            variant="body2"
            component="div"
            sx={{ lineHeight: 1, mb: 1 }}
            noWrap
          >
            <b>Reader ID: </b>{reader.id}
            <br></br>
            <b>Machine: </b> 
            {
              (machine) ? 
                <Link href={"/app/admin/equipment/"+(machine.archived ? "/archived" : "")+(machine.id)}> {machine.name}</Link>
                : "Not paired"
            }

            <br></br>
          </Typography>
          <Card variant="outlined">
            <CardContent>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{ lineHeight: 1, mb: 1 }}
                    noWrap
                >
                    Temp (&#176;C)
                </Typography>
                <Typography
                    variant="h3"
                    component="div"
                    sx={{ lineHeight: 1, mb: 1 }}
                    align="center"
                    noWrap
                >
                    {reader.temp}
                </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
            <Typography
                    variant="h6"
                    component="div"
                    sx={{ lineHeight: 1, mb: 1 }}
                    noWrap
                >
                    State
                </Typography>
                <Typography
                    variant="h4"
                    component="div"
                    sx={{ lineHeight: 1, mb: 1 }}
                    noWrap
                    align="center"
                >
                    {reader.state == null ? "NULL" : reader.state}
                </Typography>
            </CardContent>
          </Card>
          <br />
          <Stack>
            <Typography
                variant="body2"
                component="div"
                sx={{ lineHeight: 1, mb: 1 }}
                noWrap
            >
              {/* @ts-ignore */}
              <b>Last Status:</b> <span style={{ fontWeight: lastTimeDifference > 60000 ? 'bold' : 'regular', color: lastTimeDifference > 60000 ? 'red' : 'inherit' }}><TimeAgo date={reader.lastStatusTime} locale="en-US" /></span>
            </Typography>
            <Typography
                variant="body2"
                component="div"
                sx={{ lineHeight: 1, mb: 1 }}
                noWrap
            >
              <b>Reason:</b> <span  style={(reader.lastStatusReason == "Error" || reader.lastStatusReason == "Temperature") ? styles.errorText : {}}>{reader.lastStatusReason}</span><br></br>
            </Typography>
          </Stack>
          <Typography
              variant="body2"
              component="div"
              sx={{ lineHeight: 1, mb: 1 }}
              noWrap
          >
              {stateContent}
            <Stack direction="row" justifyContent={"space-between"} alignItems={"center"}>
              Identify Reader
              <Checkbox onChange={(e, checked) => handleIdentifyChecked(checked)}></Checkbox>
            </Stack>

          </Typography>
          <Stack spacing={1} alignItems="center">
            <Select defaultValue={"State"} onChange={handleChange} fullWidth>
              <MenuItem value="State">State</MenuItem>
              <MenuItem value="Idle">Idle</MenuItem>
              <MenuItem value="Unlocked">Unlocked</MenuItem>
              <MenuItem value="AlwaysOn">Always On</MenuItem>
              <MenuItem value="Lockout">Lockout</MenuItem>
              <MenuItem value="Fault">Fault</MenuItem>
              <MenuItem value="Startup">Startup</MenuItem>
              <MenuItem value="Restart">Restart</MenuItem>
            </Select>
            <Box>
              <Stack direction={"row"} spacing={2}>
                <Typography variant="body2"><b>BEVer:</b> {reader.BEVer ?? "NULL"}</Typography>
                <Typography variant="body2"><b>FEVer:</b> {reader.FEVer ?? "NULL"}</Typography>
                <Typography variant="body2"><b>HWVer:</b> {reader.HWVer ?? "NULL"}</Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </RequestWrapper>
  );
}
