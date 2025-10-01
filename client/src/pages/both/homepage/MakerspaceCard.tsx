import { Button, Card, CardActionArea, CardContent, CardMedia, Stack, Typography, useTheme } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import * as TimeUtils from "../../../common/TimeUtils";
import MakerspaceHours from "../../../types/MakerspaceHours";

interface MakerspaceCardProps {
  id: number;
  name: string;
  subtitle: string | null;
  location: string | null;
  hours: MakerspaceHours[];
  imageUrl: string;
  isMobile: boolean;
  clickable?: boolean;
}

function getHoursToday(times: MakerspaceHours[], primaryColor: string, isMobile: boolean) {
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
      width={"100%"}
      justifyContent={isMobile ? "space-between" : "flex-start"}
      spacing={"20px"}
      direction="row"
      alignItems={"center"}
    >
      <Typography color={status === "OPEN" ? "success" : "error"} fontWeight="bold">
        {status}
      </Typography>
      <Stack justifyContent="space-between" direction="row">
        <Typography color={primaryColor} fontWeight="bold">
          {TimeUtils.dayToString(now.getDay())}
        </Typography>
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

export default function MakerspaceCard(props: MakerspaceCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      sx={{ width: props.isMobile ? "350px" : "500px" }}
      elevation={isHovered ? undefined : 8}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      <CardActionArea
        onClick={
          props.clickable === true || props.clickable === undefined
            ? () => {
                navigate(`/makerspace/${props.id}`);
              }
            : () => {
                /* Do nothing */
              }
        }
      >
        <CardMedia
          component="img"
          height={props.isMobile ? "197px" : "281px"}
          image={import.meta.env.VITE_CDN_URL + "user-uploads/" + props.imageUrl}
        />
        <CardContent sx={{ justifyContent: "center", display: "flex", flexDirection: "column" }}>
          <Stack direction={"row"} justifyContent={"space-between"} alignItems={"end"}>
            <Typography variant="h4">{props.name}</Typography>
            {!props.isMobile && (
              <Typography variant="h6" color="textSecondary" alignSelf={"center"}>
                {props.location}
              </Typography>
            )}
          </Stack>

          <Typography variant="h5" color="textSecondary">
            {props.subtitle}
          </Typography>

          <Stack direction={"row"} justifyContent={"space-between"} spacing={"20px"}>
            {getHoursToday(props.hours, theme.palette.primary.main, props.isMobile)}
            {!props.isMobile && (
              <Button
                variant="contained"
                endIcon={<ChevronRightIcon />}
                sx={{ display: "flex", alignItems: "center", lineHeight: 0 }}
              >
                Explore
              </Button>
            )}
          </Stack>
          {props.isMobile && (
            <Stack direction="row" justifyContent={"space-between"} paddingTop={"10px"}>
              <Typography variant="h6" color="textSecondary" alignSelf={"center"}>
                {props.location}
              </Typography>
              <Button
                variant="contained"
                endIcon={<ChevronRightIcon />}
                sx={{ display: "flex", alignItems: "center", lineHeight: 0 }}
              >
                Explore
              </Button>
            </Stack>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
