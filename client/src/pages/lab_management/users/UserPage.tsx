import { useEffect } from "react";
import { Box, Stack } from "@mui/material";
import { useLazyQuery } from "@apollo/client";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import PrivilegeControl from "./PrivilegeControl";
import { useParams } from "react-router-dom";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import CardTagSettings from "./CardTagSettings";
import { isStaffFor, isTrainerFor } from "../../../common/PrivilegeUtils";
import { useIsMobile } from "../../../common/IsMobileProvider";
import ManageUserArchive from "./ManageUserArchive";
import { AccessCheckExtraInfo, GET_USER } from "../../../queries/userQueries";
import NavLink from "../../../top_nav/NavLink";
import HoldsRestrictions from "./userpage/HoldsRestrictions";
import AccessChecks from "./userpage/AccessChecks";
import Trainings from "./userpage/Trainings";
import Info from "./userpage/Info";
import Notes from "./userpage/Notes";

export default function UserPage() {
  const { userID} = useParams<{ userID: string }>();
  const currentUser = useCurrentUser();
  const isMobile = useIsMobile();

  const [getUser, getUserResult] = useLazyQuery(GET_USER);

  useEffect(() => {
    if (userID) getUser({ variables: { id: userID } });
  }, [userID, getUser]);

  return (
    <Box margin="10px 25px">
      <RequestWrapper2
        result={getUserResult}
        render={({ user }) => {
          return (
            <Stack>
              <Info user={user} />
              <Stack direction={isMobile ? "column" : "row"} width="100%" mt={4} spacing={4} justifyContent="center">
                <Stack width="50%">
                  <AccessChecks user={user} />
                  <Trainings user={user} />
                </Stack>

                <Stack width="50%">
                  <HoldsRestrictions user={user} />
                  <PrivilegeControl user={user} isMobile={isMobile} />
                  <CardTagSettings userID={user.id} hasCardTag={(user.cardTagID != null && user.cardTagID !== "")} />
                  <ManageUserArchive userID={user.id} forceArchive={user.forceArchive} />
                </Stack>
              </Stack>
              <Notes user={user} />
            </Stack>
          );
        }}
      />
    </Box>
  );
}
