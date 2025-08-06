import { Card, CardHeader, Divider, Stack, Typography } from "@mui/material";
import AuditLogEntity from "../../audit_logs/AuditLogEntity";
import { VerboseEquipmentSession } from "./EquipmentStats";
import { Box } from "@mui/system";
import { ScatterChart } from '@mui/x-charts/ScatterChart';
import { formatSecondsToHoursMinutes, formatTimeToMillisecondsUTC, secondsToHumanString } from "../StatisticsFunctions";

type EquipmentStatCardProps = {
  relevantEquipmentSessions: VerboseEquipmentSession[]
}


export function EquipmentStatCard({ relevantEquipmentSessions }: EquipmentStatCardProps) {
  var sumSessionlength = 0;
  var uniqueUsers: number[] = [];

  relevantEquipmentSessions.forEach((eqSession: VerboseEquipmentSession) => {
    //Add session time to sum
    sumSessionlength += eqSession.sessionLength;
    //Add all unique IDs to array
    if (!uniqueUsers.includes(eqSession.userID)) {
      uniqueUsers.push(eqSession.userID);
    }
  });

  const sessionsByWeekDay = [
    relevantEquipmentSessions.filter((item) => new Date(item.start).getDay() === 0),
    relevantEquipmentSessions.filter((item) => new Date(item.start).getDay() === 1),
    relevantEquipmentSessions.filter((item) => new Date(item.start).getDay() === 2),
    relevantEquipmentSessions.filter((item) => new Date(item.start).getDay() === 3),
    relevantEquipmentSessions.filter((item) => new Date(item.start).getDay() === 4),
    relevantEquipmentSessions.filter((item) => new Date(item.start).getDay() === 5),
    relevantEquipmentSessions.filter((item) => new Date(item.start).getDay() === 6)
  ];


  return (
    <Card sx={{ width: 800, margin: 2 }}>
      <CardHeader title={relevantEquipmentSessions[0].readerSlug}
        subheader={<AuditLogEntity entityCode={`equipment:${relevantEquipmentSessions[0].equipmentID}:${relevantEquipmentSessions[0].equipmentName}`} />}
      />

      <Stack direction={"column"}>
        <Box mx={5}>
          <Typography variant="body2" fontSize={"80%"} sx={{ opacity: 0.8 }}>
            Cummulative Time In Use
          </Typography>
          <Typography variant="h6">
            {secondsToHumanString(sumSessionlength)}
          </Typography>
        </Box>
        <Divider orientation="horizontal" />
        <Box mx={5}>
          <Typography variant="body2" fontSize={"80%"} sx={{ opacity: 0.8 }}>
            Average Time In Use
          </Typography>
          <Typography variant="h6">
            {secondsToHumanString(Math.round(sumSessionlength / relevantEquipmentSessions.length))}
          </Typography>
        </Box>
      </Stack>

      <Divider orientation="horizontal" />

      <Stack direction={"row"} justifyContent={"space-around"}>
        <Box mx={5}>
          <Typography variant="body2" fontSize={"80%"} sx={{ opacity: 0.8 }}>
            # of Sessions
          </Typography>
          <Typography variant="h6">
            {relevantEquipmentSessions.length}
          </Typography>
        </Box>
        <Divider orientation="vertical" />
        <Box mx={5}>
          <Typography variant="body2" fontSize={"80%"} sx={{ opacity: 0.8 }}>
            # of Unique Users
          </Typography>
          <Typography variant="h6">
            {uniqueUsers.length}
          </Typography>
        </Box>
      </Stack>

      <Divider orientation="horizontal" />

      <Box mx={5}>
        <ScatterChart
          height={300}
          series={[
            {
              label: `Sun (${sessionsByWeekDay[0].length})`,
              data: sessionsByWeekDay[0].map((v) => ({ 
                x: formatTimeToMillisecondsUTC(new Date(v.start).getHours(), new Date(v.start).getMinutes(), new Date(v.start).getSeconds(), new Date(v.start).getMilliseconds()), 
                y: v.sessionLength, 
                id: v.id })),
            },
            {
              label: `Mon (${sessionsByWeekDay[1].length})`,
              data: relevantEquipmentSessions.filter((item) => new Date(item.start).getDay() === 1).map((v) => ({ 
                x: formatTimeToMillisecondsUTC(new Date(v.start).getHours(), new Date(v.start).getMinutes(), new Date(v.start).getSeconds(), new Date(v.start).getMilliseconds()), 
                y: v.sessionLength, 
                id: v.id })),
            },
            {
              label: `Tue (${sessionsByWeekDay[2].length})`,
              data: relevantEquipmentSessions.filter((item) => new Date(item.start).getDay() === 2).map((v) => ({ 
                x: formatTimeToMillisecondsUTC(new Date(v.start).getHours(), new Date(v.start).getMinutes(), new Date(v.start).getSeconds(), new Date(v.start).getMilliseconds()), 
                y: v.sessionLength, 
                id: v.id })),
            },
            {
              label: `Wed (${sessionsByWeekDay[3].length})`,
              data: relevantEquipmentSessions.filter((item) => new Date(item.start).getDay() === 3).map((v) => ({ 
                x: formatTimeToMillisecondsUTC(new Date(v.start).getHours(), new Date(v.start).getMinutes(), new Date(v.start).getSeconds(), new Date(v.start).getMilliseconds()), 
                y: v.sessionLength, 
                id: v.id })),
            },
            {
              label: `Thu (${sessionsByWeekDay[4].length})`,
              data: relevantEquipmentSessions.filter((item) => new Date(item.start).getDay() === 4).map((v) => ({ 
                x: formatTimeToMillisecondsUTC(new Date(v.start).getHours(), new Date(v.start).getMinutes(), new Date(v.start).getSeconds(), new Date(v.start).getMilliseconds()), 
                y: v.sessionLength, 
                id: v.id })),
            },
            {
              label: `Fri (${sessionsByWeekDay[5].length})`,
              data: relevantEquipmentSessions.filter((item) => new Date(item.start).getDay() === 5).map((v) => ({ 
                x: formatTimeToMillisecondsUTC(new Date(v.start).getHours(), new Date(v.start).getMinutes(), new Date(v.start).getSeconds(), new Date(v.start).getMilliseconds()), 
                y: v.sessionLength, 
                id: v.id })),
            },
            {
              label: `Sat (${sessionsByWeekDay[6].length})`,
              data: relevantEquipmentSessions.filter((item) => new Date(item.start).getDay() === 6).map((v) => ({ 
                x: formatTimeToMillisecondsUTC(new Date(v.start).getHours(), new Date(v.start).getMinutes(), new Date(v.start).getSeconds(), new Date(v.start).getMilliseconds()), 
                y: v.sessionLength, 
                id: v.id })),
            },
          ]}
          xAxis={[{
            min: formatTimeToMillisecondsUTC(4,0,0,0),
            max: formatTimeToMillisecondsUTC(23,59,99,999),
            valueFormatter: (v, context) => (
              context.location === 'tick'
                ? new Date(v).toTimeString().split(" ")[0].substring(0, 5)
                : `ID: ${relevantEquipmentSessions.find((item) => formatTimeToMillisecondsUTC(new Date(item.start).getHours(), new Date(item.start).getMinutes(), new Date(item.start).getSeconds(), new Date(item.start).getMilliseconds()) === new Date(v).getTime())?.id}`
            ),
            tickInterval: [
              formatTimeToMillisecondsUTC(4,0,0,0),
              formatTimeToMillisecondsUTC(6,0,0,0),
              formatTimeToMillisecondsUTC(8,0,0,0),
              formatTimeToMillisecondsUTC(10,0,0,0),
              formatTimeToMillisecondsUTC(12,0,0,0),
              formatTimeToMillisecondsUTC(14,0,0,0),
              formatTimeToMillisecondsUTC(16,0,0,0),
              formatTimeToMillisecondsUTC(18,0,0,0),
              formatTimeToMillisecondsUTC(20,0,0,0),
              formatTimeToMillisecondsUTC(22,0,0,0),
              formatTimeToMillisecondsUTC(24,0,0,0),            
            ]
          }]}
          yAxis={[{ 
            max: 18000, 
            valueFormatter: (v) => formatSecondsToHoursMinutes(v),
            tickInterval: [
              1800,
              1800*2,
              1800*4,
              1800*6,
              1800*8,
              1800*10,
            ]
          }]}
        />
      </Box>

    </Card>
  );
}