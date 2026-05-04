import { useEffect } from "react";
import { Box, Stack } from "@mui/material";
import { useLazyQuery } from "@apollo/client/react";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import PrivilegeControl from "./userpage/PrivilegeControl";
import { useParams } from "react-router-dom";
import CardTagSettings from "./CardTagSettings";
import { useIsMobile } from "../../../common/IsMobileProvider";
import ManageUserArchive from "./ManageUserArchive";
import { GET_USER } from "../../../queries/userQueries";
import HoldsRestrictions from "./userpage/HoldsRestrictions";
import AccessChecks from "./userpage/AccessChecks";
import Trainings from "./userpage/Trainings";
import Info from "./userpage/Info";
import Notes from "./userpage/Notes";
import { useMakeTheme } from "../../../common/MakeThemeProvider";

export default function UserPage() {
  const { userID } = useParams<{ userID: string }>();
  const isMobile = useIsMobile();
  const makeTheme = useMakeTheme();

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
            <Stack spacing={4}>
              <title>{`${user.firstName} ${user.lastName} | ${makeTheme.title}`}</title>
              <Info user={user} />
              <Stack direction={isMobile ? "column" : "row"} width="100%" spacing={4} justifyContent="center">
                <Stack width={isMobile ? "100%" : "50%"}>
                  <AccessChecks user={user} />
                  <Trainings user={user} />
                </Stack>

                <Stack width={isMobile ? "100%" : "50%"}>
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
