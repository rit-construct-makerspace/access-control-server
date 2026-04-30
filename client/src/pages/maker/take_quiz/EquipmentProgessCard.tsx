import {
  Card,
  CardContent,
  Typography,
  Stack,
  CardHeader} from "@mui/material";
import { useQuery } from "@apollo/client/react";
import { GET_ACCESS_PROGRESSES } from "../../../queries/trainingQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import { AccessProgress } from "../../../types/TrainingModule";
import MinimalTrainingModuleRow from "../../../common/MinimalTrainingModuleRow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { useIsMobile } from "../../../common/IsMobileProvider";


export default function EquipmentProgressCard(props: { moduleID: number }) {
  const isMobile = useIsMobile();

  const accessProgressResult = useQuery(GET_ACCESS_PROGRESSES, { variables: { sourceTrainingModuleID: props.moduleID } });

  if (!accessProgressResult.data || accessProgressResult.data?.relatedAccessProgress.length === 0) {
    return (<></>);
  }

  const modulesToHideInPersonFor: number[] = (import.meta.env.VITE_MODULE_IDS_WITHOUT_INPERSON ?? "").split(",").map(s => Number(s));
  const shouldHideCompetency = modulesToHideInPersonFor.includes(Number(props.moduleID));

  return (
    <Card sx={{ width: (isMobile ? "90vw" : 0.85) }}>
      <CardHeader sx={{ fontWeight: "bold" }} title="Next for you"></CardHeader>
      <RequestWrapper loading={accessProgressResult.loading} error={accessProgressResult.error}>
        <CardContent>
          {accessProgressResult.data?.relatedAccessProgress.map((accessProgress: AccessProgress) => (
            <Card>
              <CardHeader title={accessProgress.equipment.name} />
              <CardContent>
                {accessProgress.passedModules.length > 0 && <Typography variant="h5">Completed</Typography>}
                <Stack direction={"column"}>
                  {accessProgress.passedModules.map((module) => (
                    <MinimalTrainingModuleRow module={module} passed={true} />
                  ))}
                </Stack>
                {accessProgress.availableModules.length > 0 && <Typography variant="h5">To-Do</Typography>}
                <Stack direction={"column"}>
                  {accessProgress.availableModules.map((module) => (
                    <MinimalTrainingModuleRow module={module} passed={false} />
                  ))}
                </Stack>
                { (!shouldHideCompetency) &&
                  <Card sx={{ mt: 5, border: (!accessProgress.accessCheckDone && accessProgress.availableModules.length === 0) ? "2px solid blue" : "inherit" }}>
                    <Stack direction={"row"} spacing={1} width={"75%"} p={2}>
                      {accessProgress.accessCheckDone
                        ? <CheckCircleIcon color="success" />
                        : <CloseIcon color="error" />}
                      <Typography variant="body2" fontWeight={"bold"} fontSize={"1.1em"}>Staff Sign-Off</Typography>
                    </Stack>
                    {(!accessProgress.accessCheckDone && accessProgress.availableModules.length === 0) &&
                      <Typography variant="body2" fontSize={"1.1em"} px={5}>Almost done! Just speak to a Maker Mentor to finish your training on the {accessProgress.equipment.name}</Typography>}
                  </Card>
                }
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </RequestWrapper>
    </Card>
  );
}
