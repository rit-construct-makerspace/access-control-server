import { Divider, Stack, Typography } from "@mui/material";
import { useCurrentUser } from "../../../../common/CurrentUserProvider";
import { useQuery } from "@apollo/client/react";
import {
  ModuleStatus,
  moduleStatusMapper,
} from "../../../../common/TrainingModuleUtils";
import RequestWrapper2 from "../../../../common/RequestWrapper2";
import { GET_ACCESS_CHECKS_BY_USERID } from "../../../../queries/accessChecksQueries";
import ModuleStatusRow from "../../../../common/ModuleStatusRow";
import { useIsMobile } from "../../../../common/IsMobileProvider";
import { GET_ALL_TRAINING_MODULES } from "../../../../queries/trainingQueries";
import { useMakeTheme } from "../../../../common/MakeThemeProvider";

export default function UserTraingingsPage() {
  const user = useCurrentUser();
  const isMobile = useIsMobile();
  const makeTheme = useMakeTheme();

  const getAllModules = useQuery(GET_ALL_TRAINING_MODULES);
  const _getAccessChecks = useQuery(GET_ACCESS_CHECKS_BY_USERID, {
    variables: { userID: user.id },
  });

  return (
    <Stack
      spacing={2}
      margin={isMobile ? "10px" : "20px"}
      width="fit-content"
      divider={<Divider orientation="horizontal" flexItem />}
    >
      {/* Trainings */}
      <RequestWrapper2
        result={getAllModules}
        render={({ modules }) => {
          const moduleStatuses = modules
            .map(moduleStatusMapper(user.passedModules, user.trainingHolds))
            .filter((ms: ModuleStatus) => !ms.archived);

          const passed = moduleStatuses.filter(
            (ms: ModuleStatus) => ms.status === "Passed"
          );

          const expiring = moduleStatuses.filter(
            (ms: ModuleStatus) => ms.status === "Expiring Soon"
          );

          return (
            <Stack
              spacing={3}
              direction={isMobile ? "column" : "row"}
              justifyContent={isMobile ? "center" : "space-between"}
              divider={
                isMobile ? (
                  <Divider orientation="horizontal" flexItem />
                ) : (
                  <Divider orientation="vertical" flexItem />
                )
              }
              height={isMobile ? undefined : "30vh"}
              width="100%"
            >
              {/* Complete Trainings */}
              <Stack width={isMobile ? "auto" : "50%"} overflow="auto">
                <Typography variant="h4" alignSelf="center">
                  Passed Trainings
                </Typography>
                {passed.map((ms: ModuleStatus) => (
                  <ModuleStatusRow ms={ms} />
                ))}
              </Stack>
              {/* Expiring Soon */}
              <Stack width={isMobile ? "auto" : "50%"} overflow="auto">
                <Typography variant="h4" alignSelf="center">
                  Trainings Expiring Soon
                </Typography>
                {expiring.map((ms: ModuleStatus) => (
                  <ModuleStatusRow ms={ms} />
                ))}
              </Stack>
            </Stack>
          );
        }}
      />
      <title>{`${user.firstName}'s Trainings | ${makeTheme.title}`}</title>
    </Stack>
  );
}
