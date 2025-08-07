import { Card, CardHeader, Divider, LinearProgress, Stack, Typography } from "@mui/material";
import AuditLogEntity from "../../audit_logs/AuditLogEntity";
import { VerboseTrainingSubmission } from "./TrainingStats";
import { Box } from "@mui/system";
import { Gauge, gaugeClasses } from "@mui/x-charts";
import { LinearProgressProps } from "@mui/x-data-grid/models/gridBaseSlots";

type TrainingStatCardProps = {
  relevantTrainingSubmissions: VerboseTrainingSubmission[]
}

function LinearProgressWithLabel(
  props: { label: string, value: number, props?: LinearProgressProps },
) {
  const color = props.value < 40 ? "error" : (props.value < 65 ? "warning" : "success");

  return (
    <Box width={"100%"} >
      <Typography
        sx={{
          position: 'relative',
          bottom: "-20px"
        }}
        variant="caption"
        component="div">
        {props.label}
      </Typography>
      <Box width={"100%"}>
        <Box
          width={"100%"}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            bottom: "-17.5px"
          }}
        >
          <Typography
            variant="caption"
            component="div"
            sx={{ color: 'white' }}
            zIndex={2}
          >{`${(props.value).toFixed(2)}%`}</Typography>
        </Box>
        <LinearProgress variant="determinate" color={color} value={props.value} {...props.props} sx={{ height: 16, borderRadius: 4 }} />

      </Box>
    </Box>
  );
}

function getColor(value: number) {
  // Ensure value is between 0 and 1
  value = Math.max(0, Math.min(1, value));

  let r, g;

  if (value <= 0.5) {
    // Interpolate between red (255, 0, 0) and yellow (255, 255, 0)
    r = 255;
    g = Math.round(255 * (value / 0.5));
  } else {
    // Interpolate between yellow (255, 255, 0) and green (0, 255, 0)
    r = Math.round(255 * ((1 - value) / 0.5));
    g = 255;
  }

  return `rgb(${r}, ${g}, 0)`;
}


export function TrainingStatCard({ relevantTrainingSubmissions }: TrainingStatCardProps) {
  var passedAttempts: number = 0;
  var failedAttempts: number = 0;
  var uniqueUsers: number[] = [];

  var sumScoreAverages: number = 0;

  var questionStats: { questionText: string, correct: number, incorrect: number, percent: number }[] = []

  const currentQuestions = relevantTrainingSubmissions[0].quiz.filter((item) => item.type === "MULTIPLE_CHOICE" || item.type === "CHECKBOX");

  relevantTrainingSubmissions.forEach((submission: VerboseTrainingSubmission) => {

    //Add all unique IDs to array
    if (!uniqueUsers.includes(submission.makerID)) {
      uniqueUsers.push(submission.makerID);
    }

    submission.passed ? passedAttempts++ : failedAttempts++;

    var numCorrect = 0;
    var numIncorrect = 0;
    submission.summary.forEach((questionSummary) => {
      //First ensure that the question is a part of the most up to date version of the quiz
      if (currentQuestions.find((item) => item.id === questionSummary.questionNum)) {
        //Fetch or create questionStats entry an count the number of correct and incorrect answers
        var exisitingQuestionStat = questionStats.find((item) => item.questionText === questionSummary.questionText);
        if (!exisitingQuestionStat) exisitingQuestionStat = questionStats[questionStats.push({
          questionText: questionSummary.questionText,
          correct: 0,
          incorrect: 0,
          percent: 0
        }) - 1];
        // console.log(exisitingQuestionStat)
        if (questionSummary.correct) exisitingQuestionStat.correct++;
        else exisitingQuestionStat.incorrect++;

        questionSummary.correct ? numCorrect++ : numIncorrect++;
      }
    });
    sumScoreAverages += numCorrect / (numCorrect + numIncorrect);
  });

  questionStats.forEach((item) => {
    item.percent = (item.correct / (item.correct + item.incorrect))
  })


  return (
    <Card sx={{ width: 500, margin: 2 }}>
      <CardHeader title={<AuditLogEntity entityCode={`module:${relevantTrainingSubmissions[0].moduleID}:${relevantTrainingSubmissions[0].moduleName}`} />} />

      <Stack direction={"row"}>
        <Box mx={5}>
          <Typography variant="body2" fontSize={"80%"} sx={{ opacity: 0.8 }}>
            Attempts Passed
          </Typography>
          <Typography variant="h4">
            {passedAttempts}
          </Typography>
        </Box>
        <Divider orientation="vertical" />
        <Box mx={5}>
          <Typography variant="body2" fontSize={"80%"} sx={{ opacity: 0.8 }}>
            Attempts Failed
          </Typography>
          <Typography variant="h4">
            {failedAttempts}
          </Typography>
        </Box>
        <Divider orientation="vertical" />
        <Box mx={5}>
          <Typography variant="body2" fontSize={"80%"} sx={{ opacity: 0.8 }}>
            Pass Rate
          </Typography>
          <Gauge
            value={passedAttempts / (passedAttempts + failedAttempts) * 100}
            text={(value) => `${value.value?.toFixed(2)}%`}
            width={60}
            height={60}
            sx={{
              '': {
                position: "relative",
                fontSize: 10
              },
              [`& .${gaugeClasses.valueArc}`]: {
                fill: getColor(passedAttempts / (passedAttempts + failedAttempts)),
              },
            }} />
        </Box>
      </Stack>

      <Divider orientation="horizontal" />

      <Stack direction={"row"} justifyContent={"space-around"}>
        <Box mx={5}>
          <Typography variant="body2" fontSize={"80%"} sx={{ opacity: 0.8 }}>
            Average Score
          </Typography>
          <Typography variant="h6" color={getColor((sumScoreAverages / relevantTrainingSubmissions.length))}>
            {((sumScoreAverages / relevantTrainingSubmissions.length) * 100).toFixed(2)}%
          </Typography>
        </Box>
        <Divider orientation="vertical" />
        <Box mx={5}>
          <Typography variant="body2" fontSize={"80%"} sx={{ opacity: 0.8 }}>
            # of Unique Users
          </Typography>
          <Typography variant="h6">
            {uniqueUsers.length}
          </Typography>
        </Box>
      </Stack>

      <Divider orientation="horizontal" />

      <Box mx={5}>
        <Stack direction={"column"} height={400} overflow={"scroll"}>
          {questionStats.map((questionStat) => (
            <LinearProgressWithLabel value={(questionStat.percent * 100)} label={questionStat.questionText} />
          ))}
        </Stack>
      </Box>

    </Card>
  );
}