import {
  Card,
  CardContent,
  Typography,
  Stack,
  CardHeader} from "@mui/material";
import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_ACCESS_PROGRESSES } from "../../../queries/trainingQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import { AccessProgress } from "../../../types/TrainingModule";
import MinimalTrainingModuleRow from "../../../common/MinimalTrainingModuleRow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";


export default function EquipmentProgressCard(props: { moduleID: number }) {
  const [width, setWidth] = useState<number>(window.innerWidth);
  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }
  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    }
  }, []);
  const isMobile = width <= 768;

  const accessProgressResult = useQuery(GET_ACCESS_PROGRESSES, { variables: { sourceTrainingModuleID: props.moduleID } });

  if (!accessProgressResult.data || accessProgressResult.data?.relatedAccessProgress.length === 0) {
    return (<></>);
  }

  return (
    <Card sx={{ width: isMobile ? "100%" : "50%" }}>
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
                { (import.meta.env.VITE_ID_3DPRINTEROS_QUIZ !== null && Number(import.meta.env.VITE_ID_3DPRINTEROS_QUIZ)!=props.moduleID) &&
                  <Card sx={{ mt: 5, border: (!accessProgress.accessCheckDone && accessProgress.availableModules.length === 0) ? "2px solid blue" : "inherit" }}>
                    <Stack direction={"row"} spacing={1} width={"75%"} p={2}>
                      {accessProgress.accessCheckDone
                        ? <CheckCircleIcon color="success" />
                        : <CloseIcon color="error" />}
                      <Typography variant="body2" fontWeight={"bold"} fontSize={"1.1em"}>In-Person Knowledge Check</Typography>
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
