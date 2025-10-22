import {
  Card,
  CardContent,
  Typography,
  Grid
} from "@mui/material";
import { Module, Submission } from "../../../types/Quiz";
import { useIsMobile } from "../../../common/IsMobileProvider";

interface SubmissionCardProps {
    submission: Submission;
    module: Module;
}

export default function SubmissionCard({ module, submission }: SubmissionCardProps) {
  const isMobile = useIsMobile();
  const submissionDate = new Date(+(submission.submissionDate)).toLocaleString('en-US');

  return (
    <Card sx={{ width: (isMobile ? "90vw" : 0.85) }}>
          <CardContent>
            <Grid container direction={isMobile ? "column" : "row"}>
              <Grid size={{xs: 12}}>
                <Typography
                  variant="h4"
                  component="div"
                >
                  Submission
                </Typography>
              </Grid>
              <Grid size={{xs: 6}}>
                <Typography
                  variant="h6"
                  sx={{fontSize: 18}}
                  component="div"
                >
                  {`${module.name}`}
                </Typography>
              </Grid>
              {!isMobile && <Grid size={{xs: 6, md: 8}}>
                <Typography
                  variant="h6"
                  component="div"
                >
                  Score
                </Typography>
              </Grid>}
              <Grid size={{xs: 6}}>
                <Typography
                  sx={{fontSize: 16}}
                  component="div"
                >
                  {`${submissionDate}`}
                </Typography>
              </Grid>
              {!isMobile && <Grid size={{xs: 6}}>
                <Typography
                  sx={{fontSize: 18}}
                  component="div"
                  color={submission.passed ?
                    `green`
                  : `red`}
                >
                  {submission.passed ?
                      `>80 (Passed)`
                    : `<80 (Failed)`}
                </Typography>
              </Grid>}
            </Grid>
            {isMobile && 
              <Grid>
                <Grid size={{xs: 6}}>
                  <Typography
                    variant="h6"
                    component="div"
                  >
                    Score
                  </Typography>
                </Grid>
                <Grid size={{xs: 6}}>
                  <Typography
                    sx={{fontSize: 18}}
                    component="div"
                    color={submission.passed ?
                      `green`
                    : `red`}
                  >
                    {submission.passed ?
                        `>80 (Passed)`
                      : `<80 (Failed)`}
                  </Typography>
                </Grid>
              </Grid>
            }
          </CardContent>
      </Card>
  );
}