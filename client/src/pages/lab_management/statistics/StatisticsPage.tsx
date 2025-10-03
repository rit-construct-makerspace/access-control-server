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
          <iframe 
          src="https://ykmrl3.stackhero-network.com/public-dashboards/ba0320862be849f0a5e863f49c312b4a"
            width={"100%"}
            height={"500px"}
          >

          </iframe>
        </Box>

        <EquipmentStats />
        <TrainingStats />
        <RoomStats />
      </Box>

    </AdminPage>
  );
}
