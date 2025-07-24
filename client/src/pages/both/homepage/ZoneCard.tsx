import { Card, CardActionArea, CardContent, CardMedia, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import * as TimeUtils from "../../../common/TimeUtils";
import ZoneHours from "../../../types/ZoneHours";

interface ZoneCardProps {
  id: number;
  name: string;
  hours: ZoneHours[];
  imageUrl: string;
  isMobile: boolean;
}

function getHoursToday(times: ZoneHours[]) {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    timeZone: "America/New_York",
    hour12: false
  });

  const displayFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    timeZone: "America/New_York",
    hour12: true,
  });

  const status = TimeUtils.currentStatus(formatter.format(times[now.getDay()].open ?? now), formatter.format(times[now.getDay()].close ?? now));

  return (
    <Stack justifyContent="space-between" direction="row">
      <Typography color={status === "OPEN" ? "success" : "error"} fontWeight="bold">{status}</Typography>
      <Stack direction="row">
        <Typography color="darkorange" fontWeight="bold">{TimeUtils.dayToString(now.getDay())}</Typography>
        <Typography paddingLeft={"10px"}>
          {
            status === "CLOSED"
              ? ""
              : `${displayFormatter.format(times[now.getDay()].open ?? now)} - ${displayFormatter.format(times[now.getDay()].close ?? now)}`
          }
        </Typography>
      </Stack>

    </Stack>
  )
}

export default function ZoneCard(props: ZoneCardProps) {

  const navigate = useNavigate();

  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card sx={{ width: props.isMobile ? "350px" : "500px" }} elevation={isHovered ? undefined : 8} onMouseEnter={() => { setIsHovered(true) }} onMouseLeave={() => { setIsHovered(false) }}>
      <CardActionArea onClick={() => { navigate(`/makerspace/${props.id}`) }}>
        <CardMedia
          component="img"
          height={props.isMobile ? "197px" : "281px"}
          image={props.imageUrl}
        />
        <CardContent>
          <Stack spacing={0.5} direction="row" alignItems="center">
            <Typography variant="h4">{props.name}</Typography>
            <ChevronRightIcon color="primary" fontSize="large" />
          </Stack>
          {getHoursToday(props.hours)}
        </CardContent>
      </CardActionArea>
    </Card>
  );
} 