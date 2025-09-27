import MakerspaceHours from "../types/MakerspaceHours";
import * as TimeUtils from "./TimeUtils";
import { Typography } from "@mui/material";
import { Stack, useTheme } from "@mui/system";


export interface CurrentHoursProps {
    times: MakerspaceHours[];
    fillLine: boolean;
    showDay: boolean;
}

export default function CurrentHours({ times, fillLine, showDay }: CurrentHoursProps) {
    const theme = useTheme();
    const now = new Date();
    const hours_today = times[now.getDay()];

    const status = hours_today.closed
        ? "CLOSED"
        : TimeUtils.currentStatus(
            hours_today.open?.substring(0, 5) ?? "12:00",
            hours_today.close?.substring(0, 5) ?? "12:00"
        );

    return (
        <Stack
            width={fillLine ? "100%" : "fit-content"}
            justifyContent={fillLine ? "space-between" : "flex-start"}
            spacing={"20px"}
            direction="row"
            alignItems={"center"}
            sx={{whiteSpace:"nowrap"}}
        >
            <Typography color={status === "OPEN" ? "success" : "error"} fontWeight="bold">
                {status}
            </Typography>
            <Stack justifyContent="space-between" direction="row">
                {showDay ? <Typography color={theme.palette.primary.main} fontWeight="bold">
                    {TimeUtils.dayToString(now.getDay())}
                </Typography> : undefined}
                <Typography paddingLeft={"10px"}>
                    {hours_today.closed
                        ? ""
                        : `${TimeUtils.reformatTime(
                            times[now.getDay()].open?.substring(0, 5) ?? "12:00"
                        )} - ${TimeUtils.reformatTime(times[now.getDay()].close?.substring(0, 5) ?? "12:00")}`}
                </Typography>
            </Stack>
        </Stack>
    );


}