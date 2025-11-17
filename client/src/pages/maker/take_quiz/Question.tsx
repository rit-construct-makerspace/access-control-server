import { QuizItem, QuizItemType } from "../../../types/Quiz";
import { Card, Typography } from "@mui/material";
import Option from "./Option";
import Markdown from "react-markdown";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";

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

const GET_CORRECT_ANSWER_COUNT = gql`
  query GetModuleQuestionAnswerCount($id: ID!, $itemID: String!) {
    moduleQuestionAnswerCount(id: $id, itemID: $itemID){
      count
    }
  }
`;

interface QuestionProps {
  moduleID: number;
  selectedOptionIDs: string[];
  quizItem: QuizItem;
  onClick: (optionID: string) => void;
  disabled: boolean;
}

export default function Question({
  moduleID,
  selectedOptionIDs,
  quizItem,
  onClick,
  disabled
}: QuestionProps) {
  const correctAnswerCount = useQuery(GET_CORRECT_ANSWER_COUNT, {variables: {id:moduleID, itemID: quizItem.id}})

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
          ? quizItem.text + ` (Please select ${correctAnswerCount.data?.moduleQuestionAnswerCount.count} choices.)`
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
