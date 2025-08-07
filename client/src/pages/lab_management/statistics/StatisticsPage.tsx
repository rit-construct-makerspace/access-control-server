import { Box, Stack, Typography } from "@mui/material";
import CountCard from "./CountCard";
import { useQuery } from "@apollo/client";
import AdminPage from "../../AdminPage";
import RequestWrapper from "../../../common/RequestWrapper";
import { GET_NUM_EQUIPMENT_SESSIONS_TODAY, GET_NUM_NEW_USERS, GET_NUM_ROOM_SWIPES_TODAY, GET_NUM_SITE_VISITS } from "./statisticsQueries";
import { EquipmentStats } from "./equipment/EquipmentStats";
import { TrainingStats } from "./training/TrainingStats";
import { RoomStats } from "./room/RoomStats";

export default function StatisticsPage() {
  //const getNumNewUsersTodayResult = useQuery(GET_NUM_NEW_USERS, {variables: {dayRange}});
  const getNumSiteVisitsTodayResult = useQuery(GET_NUM_SITE_VISITS);
  const getNumNewUsersToday = useQuery(GET_NUM_NEW_USERS);
  const getNumRoomSwipesToday = useQuery(GET_NUM_ROOM_SWIPES_TODAY);
  const getNumEquipmentSessionsToday = useQuery(GET_NUM_EQUIPMENT_SESSIONS_TODAY);

  return (
    <AdminPage>
      <Box margin="25px">
        <title>Statistics | Make @ RIT</title>
        <Typography variant="h4">Statistics</Typography>
        <Box>
          <Typography variant="h4">Today's Numbers</Typography>
          <Stack direction={"row"} flexWrap={"wrap"}>
            <RequestWrapper loading={getNumSiteVisitsTodayResult.loading} error={getNumSiteVisitsTodayResult.error}>
              <CountCard label="Site Visits" count={getNumSiteVisitsTodayResult.data?.dailySiteVisits.value} unit="visits"></CountCard>
            </RequestWrapper>
            <RequestWrapper loading={getNumRoomSwipesToday.loading} error={getNumRoomSwipesToday.error}>
              <CountCard label="Room Sign-ins" count={getNumRoomSwipesToday.data?.numRoomSwipesToday} unit="sign-ins"></CountCard>
            </RequestWrapper>
            <RequestWrapper loading={getNumEquipmentSessionsToday.loading} error={getNumEquipmentSessionsToday.error}>
              <CountCard label="Equipment Uses*" count={getNumEquipmentSessionsToday.data?.numEquipmentSessionsToday} unit="activations"></CountCard>
            </RequestWrapper>
            <RequestWrapper loading={getNumNewUsersToday.loading} error={getNumNewUsersToday.error}>
              <CountCard label="New users" count={getNumNewUsersToday.data?.numNewUsersToday} unit="users"></CountCard>
            </RequestWrapper>
          </Stack>
          <Typography variant="body2">* Only counts ACS-connected equipment</Typography>
        </Box>

        <EquipmentStats />
        <TrainingStats />
        <RoomStats />
      </Box>

    </AdminPage>
  );
}
