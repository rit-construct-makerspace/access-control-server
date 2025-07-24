import { Stack, Typography } from "@mui/material";
import { FullZone } from "../../queries/zoneQueries";
import ZoneHours from "../../types/ZoneHours";
import * as TimeUtils from "../../common/TimeUtils";

interface ZoneHoursProps {
  hours: ZoneHours[];
  isMobile: boolean;
}

function reformatTime(time: string) {
  const split = time.split(":");
  var hours = Number(split[0]);

  var suffix = " AM";
  //Hours in PM
  if (hours > 11) {
    suffix = " PM";
    hours = hours == 12 ? 12 : hours - 12
  }

  return "" + hours + ":" + split[1] + suffix;
}

export default function ZoneHoursSection(props: ZoneHoursProps) {

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    timeZone: "America/New_York",
    hour12: true
  });

  const now = new Date();

  return (
    <Stack padding="10px 0px" direction={props.isMobile ? "column" : "row"} justifyContent={props.isMobile ? "center" : "space-around"}>
      {
        props.hours.map((hour: ZoneHours) => {

          return (
            <Stack>
              <Typography color="darkorange" variant="h6">{TimeUtils.dayToString(hour.day.getDay())}</Typography>
              <Typography variant="body2">{dateFormatter.format(hour.day)}</Typography>
              {
                hour.closed
                  ? <Typography variant="body1">CLOSED</Typography>
                  : <Typography variant="body1">
                    {`${timeFormatter.format(hour.open ?? now)} - ${timeFormatter.format(hour.close ?? now)}`}
                  </Typography>
              }

            </Stack>
          )
        })
      }
    </Stack>
  );
}