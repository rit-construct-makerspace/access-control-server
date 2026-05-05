import {
  Card,
  CardContent,
  Typography,
  Stack,
  CardHeader,
  Alert,
  AlertTitle
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import ThemedMarkdown from "../../../common/ThemedMarkdown";
import { useIsMobile } from "../../../common/IsMobileProvider";

interface ResultsCardProps {
  summary: Array<ChoiceSummary>;
}

interface ChoiceSummary {
  questionNum: string;
  questionText: string;
  correct: boolean;
  comment: string;
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
  const isMobile = useIsMobile();

  //const summaryObj: Array<ChoiceSummary> = JSON.parse(summary);

  const summaryObj = summary;

  return (
    <Card sx={{ width: (isMobile ? "90vw" : 0.85) }}>
      <CardHeader title="Summary & Feedback" />
      <CardContent>
        <Stack direction={"column"} spacing={2}>
          {summaryObj.map((choiceSummary: ChoiceSummary) => (
            <Card elevation={2} sx={{ p: 2 }}>
              <Stack direction={"row"} spacing={2} alignItems="center" >
                {choiceSummary.correct
                  ? <CheckCircleIcon color="success" />
                  : <CloseIcon color="error" />}
                <Typography sx={{ fontWeight: 500, mb: 1, ...styles.strongerBolds }}><ThemedMarkdown>{choiceSummary.questionText}</ThemedMarkdown></Typography>
              </Stack>
              {
                choiceSummary.comment
                  ? <Stack direction={"row"} spacing={2} alignItems="center">
                    {choiceSummary.correct
                      ? <>
                        <ThumbUpAltOutlinedIcon color="info" />
                        <Typography sx={{ fontWeight: 500, mb: 1, ...styles.strongerBolds }}>
                          <ThemedMarkdown>{choiceSummary.comment}</ThemedMarkdown>
                        </Typography>
                      </>
                      : <Alert
                        icon={<LightbulbOutlinedIcon fontSize="inherit" />}
                        severity="warning"
                        sx={{ margin: 0 }}
                      >
                        <AlertTitle>Hint</AlertTitle>
                        <Typography sx={{ fontWeight: 500, ...styles.strongerBolds }}>
                          <ThemedMarkdown
                            components={{
                              p({ children }) {
                                return <p style={{ margin: 0 }}>{children}</p>;
                              },
                            }}
                          >
                            {choiceSummary.comment}
                          </ThemedMarkdown>
                        </Typography>
                      </Alert>
                    }
                  </Stack>
                  : null
              }
            </Card>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
