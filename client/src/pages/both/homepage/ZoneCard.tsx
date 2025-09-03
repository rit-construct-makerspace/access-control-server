import { Button, Card, CardActionArea, CardContent, CardMedia, Stack, Typography, useTheme } from "@mui/material";
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
  clickable?: boolean;
}

function getHoursToday(times: ZoneHours[]) {
  const theme = useTheme();

  const now = new Date();
  const hours_today = times[now.getDay()];

  const status = hours_today.closed ? "CLOSED" : TimeUtils.currentStatus(hours_today.open?.substring(0, 5) ?? "12:00", hours_today.close?.substring(0, 5) ?? "12:00");

  return (
    <Stack justifyContent="space-between" spacing={"20px"} direction="row" alignItems={"center"}>
      <Typography color={status === "OPEN" ? "success" : "error"} fontWeight="bold">{status}</Typography>
      <Stack direction="row" >
        <Typography color={theme.palette.primary.main} fontWeight="bold">{TimeUtils.dayToString(now.getDay())}</Typography>
        <Typography paddingLeft={"10px"} >
          {
            hours_today.closed
              ? ""
              : `${TimeUtils.reformatTime(times[now.getDay()].open?.substring(0, 5) ?? "12:00")} - ${TimeUtils.reformatTime(times[now.getDay()].close?.substring(0, 5) ?? "12:00")}`
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
      <CardActionArea
        onClick={
          (props.clickable === true || props.clickable === undefined)
            ? () => { navigate(`/makerspace/${props.id}`) }
            : () => { /* Do nothing */ }
        }>
        <CardMedia
          component="img"
          height={props.isMobile ? "197px" : "281px"}
          image={import.meta.env.VITE_CDN_URL + "user-uploads/" + props.imageUrl}
        />
        <CardContent>
          <Typography variant="h4" >{props.name}</Typography>
          <Stack direction={"row"} justifyContent={"space-between"}>
            {getHoursToday(props.hours)}
            <Button variant="outlined" endIcon={<ChevronRightIcon />}>Explore</Button>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
} 