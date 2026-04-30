import { useQuery } from "@apollo/client/react";
import { useParams } from "react-router-dom";
import { FullMakerspace, GET_MAKERSPACE_BY_ID } from "../../queries/makerspaceQueries";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { Divider, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import * as TimeUtils from "../../common/TimeUtils"
import { useEffect, useState } from "react";

export default function HoursDisplay() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const getMakerspaceResult = useQuery(GET_MAKERSPACE_BY_ID, { variables: { id: makerspaceID }, pollInterval: 300000 })

  const [date, setDate] = useState(new Date());

  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    second: "2-digit",
    timeZone: "America/New_York",
    hourCycle: "h12"
  })

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000)

    return () => {
      clearInterval(timer);
    }
  })

  return (
    <RequestWrapper2 result={getMakerspaceResult} render={(data) => {
      const makerspace: FullMakerspace = data.makerspaceByID;

      const week = makerspace.hours

      const today = new Date();

      const status = week[today.getDay()].closed === true ? "CLOSED" : TimeUtils.currentStatus(week[today.getDay()].open ?? "", week[today.getDay()].close ?? "");

      return (
        <Stack pt="25px" width="100%" height="100vh" divider={<Divider orientation="horizontal" flexItem />}>
          <Typography fontSize={100} color="primary" fontWeight="bold" textAlign="center">{makerspace.name} Hours</Typography>
          <Stack alignItems="center" justifyContent="center" flexGrow={1}>
            <Typography fontSize={160} color={status === "OPEN" ? "success" : "error"} fontWeight="bold">{status}</Typography>
            {
              !week[today.getDay()].closed && week[today.getDay()].open && week[today.getDay()].close &&
              <Typography fontSize={90}>{`${TimeUtils.reformatTime(week[today.getDay()].open ?? "")} - ${TimeUtils.reformatTime(week[today.getDay()].close ?? "")}`}</Typography>
            }
            <Typography fontSize={100} fontWeight="bold">{formatter.format(date)}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" divider={<Divider orientation="vertical" flexItem />}>
            {
              week.map((day) => {

                return (
                  <Stack width="14%" pt="20px" pb="35px">
                    <Typography variant="h3" color="secondary" textAlign="center">{TimeUtils.dayToString((new Date(day.day)).getDay())}</Typography>
                    {
                      day.closed
                        ? <Stack width="100%" height="100%" justifyContent="center">
                          <Typography variant="h4" color="error" fontWeight="bold" textAlign="center">CLOSED</Typography>
                        </Stack>
                        : <Stack width="100%">
                          <Typography variant="h4" fontWeight="bold" textAlign="center">{TimeUtils.reformatTime(day.open ?? "12:00")}</Typography>
                          <Typography variant="h4" fontWeight="bold" textAlign="center">-</Typography>
                          <Typography variant="h4" fontWeight="bold" textAlign="center">{TimeUtils.reformatTime(day.close ?? "12:00")}</Typography>
                        </Stack>
                    }
                  </Stack>
                );
              })
            }
          </Stack>
        </Stack>
      );
    }} />
  );

}