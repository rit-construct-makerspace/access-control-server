import { Divider, Stack, Typography } from "@mui/material";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client/react";
import RequestWrapper2 from "../../common/RequestWrapper2";
import MakerspaceHours, { MakerspaceDefaultHours } from "../../types/MakerspaceHours";
import DefaultHoursBlock from "./DefaultHoursBlock";
import SpecialHoursBlock from "./SpecialHoursBlock";
import NewSpecialHoursBlock from "./NewSpecialHours";
import { useIsMobile } from "../../common/IsMobileProvider";

interface ManageMakerspaceHoursProps {
  makerspaceID: number;
}

export const GET_MAKERSPACE_DEFAULT_HOURS = gql`
  query GetMakerspaceDefaultHours($makerspaceID: ID!) {
    makerspaceDefaultHours(makerspaceID: $makerspaceID) {
      dayOfWeek
      makerspaceID
      open
      close
      closed
    }
  }
`;

export const GET_MAKERSPACE_SPECIAL_HOURS = gql`
  query GetMakerspaceSpecialHours($makerspaceID: ID!) {
    makerspaceSpecialHours(makerspaceID: $makerspaceID) {
      day
      makerspaceID
      open
      close
      closed
    }
  }
`;

export default function ManageMakerspaceHours(props: ManageMakerspaceHoursProps) {
  const isMobile = useIsMobile();

  const defaultHoursResult = useQuery(GET_MAKERSPACE_DEFAULT_HOURS, { variables: { makerspaceID: props.makerspaceID } });
  const specialHoursResult = useQuery(GET_MAKERSPACE_SPECIAL_HOURS, { variables: { makerspaceID: props.makerspaceID } });

  return (
    <Stack>
      <Typography variant="h5" fontWeight={"bold"}>Makerspace Hours</Typography>
      <RequestWrapper2 result={defaultHoursResult} render={(data) => {

        const defaultHours: MakerspaceDefaultHours[] = data.makerspaceDefaultHours;

        return (
          <Stack
            direction={isMobile ? "column" : "row"}
            divider={<Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem />}
            justifyContent={"center"}
          >
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

        const specialHours: MakerspaceHours[] = data.makerspaceSpecialHours;

        return (
          <Stack
            direction={isMobile ? "column" : "row"}
            divider={<Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem />}
            justifyContent={"center"}
            sx={{ flexWrap: "wrap" }}
          >
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