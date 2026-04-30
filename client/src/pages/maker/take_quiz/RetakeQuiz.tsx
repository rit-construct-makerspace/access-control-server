import { useQuery } from "@apollo/client/react";
import { Card, CardContent, CardHeader, Link, Typography } from "@mui/material";
import { GET_PASSED_SUBMISSION, GET_REMAINING_SUBMISSIONS } from "../../../queries/getSubmissions";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { Stack } from "@mui/system";
import RequestWrapper from "../../../common/RequestWrapper";

export default function RetakeQuiz(props: { moduleID: number }) {
    const isMobile = useIsMobile();

    const submissions = useQuery(GET_REMAINING_SUBMISSIONS,
        {
            variables: { moduleID: props.moduleID },
            fetchPolicy: 'network-only',
        }
    );
    const passedSubmission = useQuery(GET_PASSED_SUBMISSION, {variables: {moduleID: props.moduleID}});
    const expirationDate = new Date(+(passedSubmission?.data?.passingSubmission?.expirationDate)).toLocaleString('en-US');
    const remainingAttempts = Number(submissions.data?.remainingSubmissions.submissionLimit) - Number(submissions.data?.remainingSubmissions.failedSubmissions)

  return (
    <RequestWrapper loading={ submissions.loading || submissions.data === undefined }
      error={ submissions.error } >
    <Card sx={{ width: (isMobile ? "90vw" : 0.85) }}>
      <CardHeader sx={{ fontWeight: "bold" }} title="Retake This Quiz"></CardHeader>
      <CardContent>
        <Card>
          <CardContent>
            {passedSubmission?.data?.passingSubmission ? <Typography>Your training expires on {expirationDate}</Typography> : <></>}
            {remainingAttempts <= 0 ?
              <Stack>
                <Typography><b>This training has been locked due to too many attempts. </b></Typography>
                <Typography>You will be unable to progress and submit this quiz until <b>tomorrow</b>.</Typography>
                <Typography>If you would like to unlock this training early and seek help with the quiz, please see a Makerspace Mentor.</Typography>
              </Stack>
              : <Stack>
                <Typography>Click <Link href={`/app/maker/training/${props.moduleID}`}>here</Link> {passedSubmission?.data?.passingSubmission? <>if you would like to renew your training.</>: <>to retake this quiz.</>}</Typography>
                <Typography component="div">You have {remainingAttempts} {remainingAttempts === 1 ? <>attempt</> : <>attempts</>} remaining today.</Typography>
              </Stack>
            }
          </CardContent>
        </Card>
      </CardContent>
    </Card>
    </RequestWrapper>
    )

}