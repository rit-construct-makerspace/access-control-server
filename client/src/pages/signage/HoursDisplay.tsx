import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { GET_ZONE_BY_ID, ZoneWithHours } from "../../queries/zoneQueries";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { Divider, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { currentStatus, makeDayArray, reformatTime } from "../../common/TimeUtils";
import TimeAgo from "react-timeago";
import { useEffect, useState } from "react";

export default function HoursDisplay() {
    const { makerspaceID } = useParams<{makerspaceID: string}>();

    const getZoneResult = useQuery(GET_ZONE_BY_ID, {variables: {id: makerspaceID}, pollInterval: 300000})

    const [date, setDate] = useState(new Date());

    const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        second: "2-digit",
        timeZone: "America/New_York",
        hourCycle: "h12"
    })

    useEffect(() => {
        var timer = setInterval(() => setDate(new Date()), 1000)

        return () => {
            clearInterval(timer);
        }
    })

    return (
        <RequestWrapper2 result={getZoneResult} render={(data) => {
            const makerspace: ZoneWithHours = data.zoneByID;

            const week = makeDayArray(makerspace.hours).sort((a, b) => a.dayID - b.dayID); //Sort to ensure proper ordering

            const today = new Date();

            const status = currentStatus(week[today.getDay()].open ?? "", week[today.getDay()].close ?? "");

            return (
                <Stack pt="25px" width="100%" height="100vh" divider={<Divider orientation="horizontal" flexItem/>}>
                    <Typography fontSize={100} color="primary" fontWeight="bold" textAlign="center">{makerspace.name} Hours</Typography>
                    <Stack alignItems="center" justifyContent="center" flexGrow={1}>
                        <Typography fontSize={160} color={status === "OPEN" ? "success" : "error"} fontWeight="bold">{status}</Typography>
                        {
                            week[today.getDay()].open && week[today.getDay()].close &&
                            <Typography fontSize={90}>{`${reformatTime(week[today.getDay()].open ?? "")} - ${reformatTime(week[today.getDay()].close ?? "")}`}</Typography>
                        }
                        <Typography fontSize={100} fontWeight="bold">{formatter.format(date)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" divider={<Divider orientation="vertical" flexItem/>}>
                        {
                            week.map((day) => {
                                
                                const closed = day.open == undefined || day.close == undefined;

                                return (
                                    <Stack width="14%" pt="20px" pb="35px">
                                        <Typography variant="h3" color="secondary" textAlign="center">{day.name}</Typography>
                                            {
                                                closed
                                                ? <Stack width="100%" height="100%" justifyContent="center">
                                                    <Typography variant="h4" color="error" fontWeight="bold" textAlign="center">CLOSED</Typography>
                                                </Stack>
                                                : <Stack width="100%">
                                                    <Typography variant="h4" fontWeight="bold" textAlign="center">{reformatTime(day.open ?? "")}</Typography>
                                                    <Typography variant="h4" fontWeight="bold" textAlign="center">-</Typography>
                                                    <Typography variant="h4" fontWeight="bold" textAlign="center">{reformatTime(day.close ?? "")}</Typography>
                                                </Stack>
                                            }
                                    </Stack>
                                );
                            })
                        }
                    </Stack>
                </Stack>
            );
        }}/>
    );
    
}