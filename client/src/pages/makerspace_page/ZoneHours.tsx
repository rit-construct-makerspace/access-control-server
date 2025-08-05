import { Stack, Typography } from "@mui/material";
import ZoneHours from "../../types/ZoneHours";
import * as TimeUtils from "../../common/TimeUtils";

interface ZoneHoursProps {
  hours: ZoneHours[];
  isMobile: boolean;
}

export default function ZoneHoursSection(props: ZoneHoursProps) {

  return (
    <Stack padding="10px 0px" direction={props.isMobile ? "column" : "row"} justifyContent={props.isMobile ? "center" : "space-around"}>
      {
        props.hours.map((hour: ZoneHours) => {

          const dayDate = new Date(hour.day);

          return (
            <Stack alignItems={"center"}>
              <Typography color="darkorange" variant="h6">{TimeUtils.dayToString(dayDate.getDay())}</Typography>
              {
                hour.closed
                  ? <Typography variant="body1">CLOSED</Typography>
                  : <Typography variant="body1">
                    {`${TimeUtils.reformatTime(hour.open?.substring(0, 5) ?? "12:00")} - ${TimeUtils.reformatTime(hour.close?.substring(0, 5) ?? "12:00")}`}
                  </Typography>
              }

            </Stack>
          )
        })
      }
    </Stack>
  );
}