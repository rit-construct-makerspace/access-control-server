import { useQuery } from "@apollo/client";
import { Card, CardContent, CardHeader, Link, Typography } from "@mui/material";
import { GET_REMAINING_SUBMISSIONS } from "../../../queries/getSubmissions";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { Stack } from "@mui/system";

export default function RetakeQuiz(props: { moduleID: number }) {
    const isMobile = useIsMobile();

    const submissions = useQuery(GET_REMAINING_SUBMISSIONS,
        {
            variables: { moduleID: props.moduleID },
            fetchPolicy: 'network-only',
        }
    );

  return (
    <Card sx={{ width: isMobile ? "100%" : "50%" }}>
      <CardHeader sx={{ fontWeight: "bold" }} title="Retake This Quiz"></CardHeader>
      <CardContent>
        <Card>
          <CardContent>
            {submissions.data?.remainingSubmissions.submissions >= submissions.data?.remainingSubmissions.submissionLimit ?
              <Stack>
                <Typography><b>This training has been locked due to too many attempts. </b></Typography>
                <Typography>You will be unable to progress and submit this quiz until <b>tomorrow</b>.</Typography>
                <Typography>If you would like to unlock this training early and seek help with the quiz, please see a Makerspace Mentor.</Typography>
              </Stack>
              : <Stack>
                <Typography>Click <Link href={`/app/maker/training/${props.moduleID}`}>here</Link> to retake this quiz.</Typography>
                <Typography component="div">You have {submissions.data?.remainingSubmissions.submissionLimit - submissions.data?.remainingSubmissions.submissions} attempts remaining today.</Typography>
              </Stack>
            }
          </CardContent>
        </Card>
      </CardContent>
    </Card>
    )

}