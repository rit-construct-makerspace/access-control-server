import { Stack, Typography, useTheme } from "@mui/material";
import MakerspaceHours from "../../types/MakerspaceHours";
import * as TimeUtils from "../../common/TimeUtils";

interface MakerspaceHoursProps {
  hours: MakerspaceHours[];
}

export default function MakerspaceHoursSection(props: MakerspaceHoursProps) {
  const theme = useTheme();
  const today = (new Date()).getDay();
  return (
    <Stack padding="10px 0px" direction={"column"} justifyContent={"center"}>
      {
        props.hours.map((hour: MakerspaceHours) => {
          const dayDate = new Date(hour.day);
          const boldThis = today == dayDate.getDay();

          return (
            <Stack alignItems={"center"} direction={"row"} justifyContent={"space-between"}>
              <Typography color={theme.palette.primary.main} variant="h6" fontWeight={boldThis ? "bold" : "regular" }>{TimeUtils.dayToString(dayDate.getDay())}</Typography>
              {
                hour.closed
                  ? <Typography variant="body1">CLOSED</Typography>
                  : <Typography variant="body1" fontWeight={boldThis ? "bold" : "regular" }>
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