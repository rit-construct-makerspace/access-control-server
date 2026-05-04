import { useQuery } from "@apollo/client/react";
import { Stack } from "@mui/material";
import { useParams } from "react-router-dom";
import RequestWrapper from "../../../common/RequestWrapper";
import { GET_LATEST_SUBMISSION, GET_SUBMISSION } from "../../../queries/getSubmissions";
import { GET_MODULE } from "../../../queries/trainingQueries";
import { Module } from "../../../types/Quiz";
import SubmissionCard from "./SubmissionCard";
import ResultsCard from "./ResultsCard";
import EquipmentProgressCard from "./EquipmentProgessCard";
import RetakeQuiz from "./RetakeQuiz";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { useMakeTheme } from "../../../common/MakeThemeProvider";

export default function QuizResults() {
  const { id } = useParams<{ id: string }>();
  const { submissionID } = useParams<{ submissionID: string }>();
  const currentUser = useCurrentUser();
  const makeTheme = useMakeTheme();

  const currentSubmissionResult = useQuery(GET_LATEST_SUBMISSION,
    {
      variables: { moduleID: id },
      fetchPolicy: 'network-only', // Prevents caching previous submissions if multiple attempts are made in one session
      nextFetchPolicy: 'cache-first' // Caches this submission while we are using it
    }
  );
  const passedSubmissionResult = useQuery(GET_SUBMISSION,
    {
      variables: { submissionID: submissionID },
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'cache-first'
    }
  );

  const moduleResult = useQuery<{ module: Module }>(
    GET_MODULE,
    {
      variables: { id }
    }
  );
  const isMobile = useIsMobile();


  return (
    <RequestWrapper
      loading={currentSubmissionResult.loading || currentSubmissionResult.data === undefined}
      error={currentSubmissionResult.error || currentSubmissionResult.error}
    >
      <RequestWrapper
        loading={moduleResult.loading || moduleResult.data === undefined}
        error={moduleResult.error}
      >
        <Stack spacing={2} justifyContent={"center"} margin={"30px 45px"}>
          <title>{`${moduleResult.data?.module?.name} Results | ${makeTheme.title}`}</title>
          {submissionID && passedSubmissionResult?.data?.submission.makerID === currentUser.id ?
            <Stack direction={"row"} alignItems={"flex-start"} width={"100%"} >
              <Stack direction="column" width={isMobile ? "100%" : "50%"} spacing={2}>
                <SubmissionCard module={moduleResult.data?.module} submission={passedSubmissionResult.data?.submission} />
                {isMobile && moduleResult.data ? <RetakeQuiz moduleID={moduleResult.data?.module.id} ></RetakeQuiz> : <></>}
                {isMobile && moduleResult.data && <EquipmentProgressCard moduleID={moduleResult.data?.module.id} />}
                <ResultsCard summary={passedSubmissionResult.data?.submission.summary}></ResultsCard>
              </Stack>
              <Stack direction="column" width={isMobile ? "100%" : "50%"} spacing={2}>
                {!isMobile && moduleResult.data ? <RetakeQuiz moduleID={moduleResult.data?.module.id} ></RetakeQuiz> : <></>}
                {!isMobile && moduleResult.data && <EquipmentProgressCard moduleID={moduleResult.data?.module.id} />}
              </Stack>
            </Stack>
            :
            <Stack direction={"row"} alignItems={"flex-start"} width={"100%"} >
              <Stack direction="column" width={isMobile ? "100%" : "50%"} spacing={2}>
                <SubmissionCard module={moduleResult.data?.module} submission={currentSubmissionResult.data?.latestSubmission} />
                {isMobile && moduleResult.data ? <RetakeQuiz moduleID={moduleResult.data?.module.id} ></RetakeQuiz> : <></>}
                {isMobile && moduleResult.data && <EquipmentProgressCard moduleID={moduleResult.data?.module.id} />}
                <ResultsCard summary={currentSubmissionResult.data?.latestSubmission.summary}></ResultsCard>
              </Stack>
              <Stack direction="column" width={isMobile ? "100%" : "50%"} spacing={2}>
                {!isMobile && moduleResult.data ? <RetakeQuiz moduleID={moduleResult.data?.module.id} ></RetakeQuiz> : <></>}
                {!isMobile && moduleResult.data && <EquipmentProgressCard moduleID={moduleResult.data?.module.id} />}
              </Stack>
            </Stack>}
        </Stack>
      </RequestWrapper>
    </RequestWrapper>
  );
}