import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { GET_ZONE_BY_ID, ZoneWithHours } from "../../queries/zoneQueries";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { Divider, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { currentStatus, makeDayArray, reformatTime } from "../../common/TimeUtils";

export default function HoursDisplay() {
    const { makerspaceID } = useParams<{makerspaceID: string}>();

    const getZoneResult = useQuery(GET_ZONE_BY_ID, {variables: {id: makerspaceID}, pollInterval: 300000})

    return (
        <RequestWrapper2 result={getZoneResult} render={(data) => {
            const makerspace: ZoneWithHours = data.zoneByID;

            const week = makeDayArray(makerspace.hours).sort((a, b) => a.dayID - b.dayID); //Sort to ensure proper ordering

            const today = new Date().getDay();

            const status = currentStatus(week[today].open ?? "", week[today].close ?? "");

            return (
                <Stack pt="25px" width="100%" divider={<Divider orientation="horizontal" flexItem/>}>
                    <Typography fontSize={100} color="primary" fontWeight="bold" textAlign="center">{makerspace.name} Hours</Typography>
                    <Stack direction="row" justifyContent="space-around">
                        <Typography variant="h1" color={status === "OPEN" ? "success" : "error"}>{status}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" divider={<Divider orientation="vertical" flexItem/>}>
                        {
                            week.map((day) => {
                                
                                const closed = day.open == undefined || day.close == undefined;
                            
                                return (
                                    <Stack width="14%">
                                        <Typography variant="h3" color="primary" textAlign="center">{day.name}</Typography>
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