import { useQuery } from "@apollo/client";
import { Grid, Stack } from "@mui/material";
import { useParams } from "react-router-dom";
import { useImmer } from "use-immer";
import RequestWrapper from "../../../common/RequestWrapper";
import { GET_LATEST_SUBMISSION, GET_SUBMISSION, GET_SUBMISSIONS } from "../../../queries/getSubmissions";
import { GET_MODULE } from "../../../queries/trainingQueries";
import { Module } from "../../../types/Quiz";
import Page from "../../Page";
import SubmissionCard from "./SubmissionCard";
import ResultsCard from "./ResultsCard";
import EquipmentProgressCard from "./EquipmentProgessCard";
import { useState, useEffect } from "react";

export default function QuizResults() {
  const { id } = useParams<{ id: string }>();
  const submissionResult = useQuery(GET_LATEST_SUBMISSION,
    { 
      variables: { moduleID: id },
      fetchPolicy: 'network-only', // Prevents caching previous submissions if multiple attempts are made in one session
      nextFetchPolicy: 'cache-first' // Caches this submission while we are using it
    }
  );
  const moduleResult = useQuery<{module: Module}>(
    GET_MODULE,
    {
      variables: { id }
    }
  );

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

  return (
    <RequestWrapper
      loading={ submissionResult.loading || submissionResult.data === undefined }
      error={ submissionResult.error }
    >
      <RequestWrapper
          loading={ moduleResult.loading || moduleResult.data === undefined }
          error={ moduleResult.error }
        >
        <Page title="Quiz Results">
          <Stack direction={"row"} justifyContent={"flex-start"} width={"100%"}>
            <Stack direction="column" width={isMobile ? "100%" : "50%"}>
              <SubmissionCard module={moduleResult.data?.module!} submission={submissionResult.data?.latestSubmission}/>
              {isMobile && moduleResult.data && <EquipmentProgressCard moduleID={moduleResult.data?.module.id} />}
              <ResultsCard summary={submissionResult.data?.latestSubmission.summary}></ResultsCard>
            </Stack>
            {!isMobile && moduleResult.data && <EquipmentProgressCard moduleID={moduleResult.data?.module.id} />}
          </Stack>
        </Page>
      </RequestWrapper>
    </RequestWrapper>
  );
}
