import {
  Card,
  CardContent,
  Typography,
  Stack,
  CardHeader
} from "@mui/material";
import Markdown from "react-markdown";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";

interface ResultsCardProps {
    summary: Array<ChoiceSummary>
}

interface ChoiceSummary {
  questionNum: string;
  questionText: string;
  correct: boolean;
}

const styles = {
  strongerBolds: {
    '& p': {
      fontWeight: 400
    },
    '& strong': {
      fontWeight: 900
    }
  }
};


export default function SubmissionCard({ summary }: ResultsCardProps) {
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

  //const summaryObj: Array<ChoiceSummary> = JSON.parse(summary);

  const summaryObj = summary;

  return (
    <Card sx={{ width: (isMobile ? "90vw" : 0.85) }}>
      <CardHeader title="Question Summary"></CardHeader>
      <CardContent>
        {summaryObj.map((choiceSummary: ChoiceSummary) => (
          <Card elevation={2} sx={{ p: 2 }}>
            <Stack direction={"row"} spacing={2} alignItems="center" >
              {choiceSummary.correct 
              ? <CheckCircleIcon color="success" />
              : <CloseIcon color="error" />}
              <Typography sx={{ fontWeight: 500, mb: 1, ...styles.strongerBolds }}><Markdown>{choiceSummary.questionText}</Markdown></Typography>
            </Stack>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
