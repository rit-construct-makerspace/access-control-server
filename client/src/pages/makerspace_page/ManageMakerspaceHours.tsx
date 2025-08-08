import { Divider, Stack, Typography } from "@mui/material";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import RequestWrapper2 from "../../common/RequestWrapper2";
import ZoneHours, { ZoneDefaultHours } from "../../types/ZoneHours";
import DefaultHoursBlock from "./DefaultHoursBlock";
import SpecialHoursBlock from "./SpecialHoursBlock";
import NewSpecialHoursBlock from "./NewSpecialHours";

interface ManageMakerspaceHoursProps {
  makerspaceID: number;
}

export const GET_ZONE_DEFAULT_HOURS = gql`
  query GetZoneDefaultHours($makerspaceID: ID!) {
    zoneDefaultHours(makerspaceID: $makerspaceID) {
      dayOfWeek
      makerspaceID
      open
      close
      closed
    }
  }
`;

export const GET_ZONE_SPECIAL_HOURS = gql`
  query GetZoneSpecialHours($makerspaceID: ID!) {
    zoneSpecialHours(makerspaceID: $makerspaceID) {
      day
      makerspaceID
      open
      close
      closed
    }
  }
`;

export default function ManageMakerspaceHours(props: ManageMakerspaceHoursProps) {
  const defaultHoursResult = useQuery(GET_ZONE_DEFAULT_HOURS, { variables: { makerspaceID: props.makerspaceID } });
  const specialHoursResult = useQuery(GET_ZONE_SPECIAL_HOURS, { variables: { makerspaceID: props.makerspaceID } });

  return (
    <Stack>
      <Typography variant="h5" fontWeight={"bold"}>Makerspace Hours</Typography>
      <RequestWrapper2 result={defaultHoursResult} render={(data) => {

        const defaultHours: ZoneDefaultHours[] = data.zoneDefaultHours;

        return (
          <Stack direction={"row"} divider={<Divider orientation="vertical" flexItem />} justifyContent={"center"}>
            {
              defaultHours.map((hours) => {

                return (
                  <DefaultHoursBlock hours={hours} />
                );
              })
            }
          </Stack>
        );
      }} />
      <Typography variant="h5" fontWeight={"bold"}>Special Hours</Typography>
      <RequestWrapper2 result={specialHoursResult} render={(data) => {

        const specialHours: ZoneHours[] = data.zoneSpecialHours;

        return (
          <Stack direction={"row"} divider={<Divider orientation="vertical" flexItem />} justifyContent={"center"} sx={{ flexWrap: "wrap" }}>
            {
              specialHours.map((hours) => (<SpecialHoursBlock hours={hours} />))
            }
            <NewSpecialHoursBlock />
          </Stack>
        )
      }} />
    </Stack >
  );
}