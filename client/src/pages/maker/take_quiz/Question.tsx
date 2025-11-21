import { QuizItem, QuizItemType } from "../../../types/Quiz";
import { Card, Typography } from "@mui/material";
import Option from "./Option";
import Markdown from "react-markdown";

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

interface QuestionProps {
  selectedOptionIDs: string[];
  quizItem: QuizItem;
  onClick: (optionID: string) => void;
  disabled: boolean;
}

export default function Question({
  selectedOptionIDs,
  quizItem,
  onClick,
  disabled
}: QuestionProps) {
  return (
    <Card elevation={2} sx={{ p: 2 }}>
      <Typography sx={{ fontWeight: 500, mb: 1, ...styles.strongerBolds }}>
        <Markdown
          components={{
            a({ children, ...props }) {
              return <a target="_blank" rel="noopener noreferrer"{...props}>{children}</a>;
            },
          }}
        >{quizItem.type === QuizItemType.Checkboxes 
          ? quizItem.text + ` (Please select ${quizItem?.correctAnswers} choices.)`
          : quizItem.text}</Markdown>
      </Typography>
      {quizItem.options?.map((o) => (
        <Option
          key={o.id}
          type={quizItem.type}
          text={o.text}
          selected={selectedOptionIDs.includes(o.id)}
          onClick={() => onClick(o.id)}
          disabled={disabled}
        />
      ))}
    </Card>
  );
}
