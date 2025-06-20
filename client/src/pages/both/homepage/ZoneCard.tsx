import { Card, CardActionArea, CardContent, CardMedia, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { currentStatus, dayToStringMake, reformatTime } from "../../../common/TimeUtils";

interface ZoneCardProps {
    id: number;
    name: string;
    hours: {type: string, dayOfTheWeek: number, time: string}[];
    imageUrl: string;
    isMobile: boolean;
}

function getHoursToday(times: {type: string, dayOfTheWeek: number, time: string}[]) {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone: 'America/New_York'
    });
    var today = formatter.format(date);
    var rawOpen = "";
    var rawClose = "";

    times.map((time: {type: string, dayOfTheWeek: number, time: string}, index) => {
        if (dayToStringMake(time.dayOfTheWeek) === today && time.type === "OPEN") {
            rawOpen = time.time;
        }

        if (dayToStringMake(time.dayOfTheWeek) === today && time.type === "CLOSE") {
            rawClose = time.time;
        }
        
    })

    const status = currentStatus(rawOpen, rawClose);

    return (
        <Stack justifyContent="space-between" direction="row">
            <Typography color={status === "OPEN" ? "success" : "error"} fontWeight="bold">{status}</Typography>
            <Stack direction="row">
                <Typography color="darkorange" fontWeight="bold">{today}</Typography>
                <Typography paddingLeft={"10px"}>{rawOpen !== "" ? rawClose !== "" ? `${reformatTime(rawOpen)} - ${reformatTime(rawClose)}` : "" : ""}</Typography>
            </Stack>
            
        </Stack>
    )
}

export default function ZoneCard(props: ZoneCardProps) {

    const navigate = useNavigate();

    const [isHovered, setIsHovered] = useState(false);

    return (
        <Card sx={{width: props.isMobile ? "350px" : "500px"}} elevation={isHovered ? undefined : 8} onMouseEnter={() => {setIsHovered(true)}} onMouseLeave={() => {setIsHovered(false)}}>
            <CardActionArea onClick={() => {navigate(`/makerspace/${props.id}`)}}>
                <CardMedia
                    component="img"
                    height={props.isMobile ? "197px" : "281px"}
                    image={props.imageUrl}
                />
                <CardContent>
                    <Stack spacing={0.5} direction="row" alignItems="center">
                        <Typography variant="h4">{props.name}</Typography>
                        <ChevronRightIcon color="primary" fontSize="large"/>
                    </Stack>
                    {getHoursToday(props.hours)}
                </CardContent>
            </CardActionArea>
        </Card>
    );
} 