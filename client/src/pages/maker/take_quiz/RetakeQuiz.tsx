import { useQuery } from "@apollo/client";
import { Button, Card, CardActionArea, CardContent, CardHeader, Grid, Link, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { GET_FAILED_SUBMISSIONS } from "../../../queries/getSubmissions";
import { useEffect, useState } from "react";

export default function RetakeQuiz(props: { moduleID: number }) {
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

    const navigate = useNavigate();
    const failedSubmissions = useQuery(GET_FAILED_SUBMISSIONS,
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
              <Grid container direction={isMobile ? "column" : "row"} >
                    {Number(failedSubmissions.data?.failedSubmissions.length) >= Number(import.meta.env.VITE_TRAINING_MAX_ATTEMPTS_PER_DAY_BEFORE_LOCK) ?
                      <Grid>
                      <Typography><b>This training has been locked due to too many attempts. </b></Typography>
                      <Typography>You will be unable to progress and submit this quiz until <b>tomorrow</b>.</Typography>
                      <Typography>If you would like to unlock this training early and seek help with the quiz, please see a Makerspace Mentor.</Typography> 
                      </Grid>
                      : <Grid>
                        <Typography>Click <Link href = {`/app/maker/training/${props.moduleID}`}>here</Link> to retake this quiz.</Typography>
                        <Typography component="div">You have {Number(import.meta.env.VITE_TRAINING_MAX_ATTEMPTS_PER_DAY_BEFORE_LOCK) - Number(failedSubmissions.data?.failedSubmissions.length)} attempts remaining today.</Typography>
                        </Grid>
                    }
              </Grid>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    )

}