import { Card, CardHeader, Divider, Stack, Typography } from "@mui/material";
import AuditLogEntity from "../../audit_logs/AuditLogEntity";
import { VerboseRoomSwipe } from "./RoomStats";
import { Box } from "@mui/system";
import { LineChart } from "@mui/x-charts";
import { getDateRange } from "../StatisticsFunctions";

type RoomStatCardProps = {
  relevantRoomSwipes: VerboseRoomSwipe[]
}


export function RoomStatCard({ relevantRoomSwipes }: RoomStatCardProps) {
  var uniqueUsers: number[] = [];
  var sumSwipesPerDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
  var earliestDate: Date | undefined = undefined;
  var latestDate: Date | undefined = undefined;

  var sumSwipesPerDate: {date: Date, num: number, id: number}[] = [];

  relevantRoomSwipes.forEach((roomSwipe: VerboseRoomSwipe) => {
    const date = new Date(roomSwipe.dateTime);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);

    //Increment sum for session's day of week
    sumSwipesPerDayOfWeek[new Date(roomSwipe.dateTime).getDay()]++;
    //Add all unique IDs to array
    if (!uniqueUsers.includes(roomSwipe.userID)) {
      uniqueUsers.push(roomSwipe.userID);
    }

    //Set new earliest date if current date is earlier
    if (!earliestDate || (earliestDate as Date).getTime() > date.getTime()) {
      earliestDate = date;
    }
    //Set new latest date if current date is later
    if (!latestDate || (latestDate as Date).getTime() < date.getTime()) {
      latestDate = date;
    }

    //increment swipes per exact date
    const sumSwipesPerDateIndex = sumSwipesPerDate.findIndex((item) => 
      item.date.getFullYear() === date.getFullYear()
      && item.date.getMonth() === date.getMonth()
      && item.date.getDate() === date.getDate()
    );
    if (sumSwipesPerDateIndex === -1) {
      sumSwipesPerDate.push({date, num: 1, id: date.getTime()});
    } else {
      sumSwipesPerDate[sumSwipesPerDateIndex].num++;
    }
  });

  const numDays = (earliestDate && latestDate) ? Math.round(Math.abs((earliestDate - latestDate) / (24 * 60 * 60 * 1000))) : undefined;
  const numWeeks = numDays ? Math.ceil(numDays / 7) : 1;

  var avgSwipesPerDayOfWeek = sumSwipesPerDayOfWeek.map((sum: number) => sum / numWeeks);

  return (
    <Card sx={{ width: "100%", margin: 2 }}>
      <CardHeader title={<AuditLogEntity entityCode={`room:${relevantRoomSwipes[0].roomID}:${relevantRoomSwipes[0].roomName}`} />} />

      <Stack direction={"row"}>
        <Box mx={5}>
          <Typography variant="body2" fontSize={"80%"} sx={{ opacity: 0.8 }}>
            Total Swipes
          </Typography>
          <Typography variant="h6">
            {relevantRoomSwipes.length}
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

      <Stack direction={"row"} justifyContent={"space-around"}>
        <Box mx={5} width={"100%"}>
          <Typography variant="body2" fontSize={"80%"} sx={{ opacity: 0.8 }}>
            Average Swipes per Day of the Week
          </Typography>
          <Stack direction={"row"} justifyContent={"space-around"}>
            <Box>
              <Typography variant="body2" color="primary" fontWeight={"bold"} fontSize={"80%"} sx={{ opacity: 0.8 }}>
                Sun
              </Typography>
              <Typography variant="h6">
                {avgSwipesPerDayOfWeek[0].toFixed(1)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="primary" fontWeight={"bold"} fontSize={"80%"} sx={{ opacity: 0.8 }}>
                Mon
              </Typography>
              <Typography variant="h6">
                {avgSwipesPerDayOfWeek[1].toFixed(1)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="primary" fontWeight={"bold"} fontSize={"80%"} sx={{ opacity: 0.8 }}>
                Tue
              </Typography>
              <Typography variant="h6">
                {avgSwipesPerDayOfWeek[2].toFixed(1)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="primary" fontWeight={"bold"} fontSize={"80%"} sx={{ opacity: 0.8 }}>
                Wed
              </Typography>
              <Typography variant="h6">
                {avgSwipesPerDayOfWeek[3].toFixed(1)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="primary" fontWeight={"bold"} fontSize={"80%"} sx={{ opacity: 0.8 }}>
                Thu
              </Typography>
              <Typography variant="h6">
                {avgSwipesPerDayOfWeek[4].toFixed(1)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="primary" fontWeight={"bold"} fontSize={"80%"} sx={{ opacity: 0.8 }}>
                Fri
              </Typography>
              <Typography variant="h6">
                {avgSwipesPerDayOfWeek[5].toFixed(1)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="primary" fontWeight={"bold"} fontSize={"80%"} sx={{ opacity: 0.8 }}>
                Sat
              </Typography>
              <Typography variant="h6">
                {avgSwipesPerDayOfWeek[6].toFixed(1)}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>

      <Divider orientation="horizontal" />

      <Box mx={1}>
        <LineChart
          dataset={sumSwipesPerDate}
          xAxis={[{ 
            dataKey: 'date', 
            valueFormatter: (v) => (
              `${new Date(v).getMonth()+1}/${new Date(v).getDate()}/${new Date(v).getFullYear().toString().substring(2)}`
            ),
            min: earliestDate,
            max: latestDate,
            tickInterval: getDateRange(earliestDate ?? new Date(), latestDate ?? new Date(), relevantRoomSwipes.length < 3000 ? 1 : 7)
           }]}
          series={[{ dataKey: 'num', showMark: true }]}
          tooltip={{ trigger: 'none', }}
          grid={{ vertical: true, horizontal: true }}
          height={300}
        />
      </Box>

    </Card>
  );
}