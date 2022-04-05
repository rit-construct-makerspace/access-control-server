import React from "react";
import {
  Button,
  CardContent,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import OptionDraft from "./OptionDraft";
import QuizItemDraft from "./QuizItemDraft";
import { v4 as uuidv4 } from "uuid";
import produce, { Draft } from "immer";
import { Option, QuizItem, QuizItemType } from "../../../../types/Quiz";

function updateOptions(
  draft: Draft<Required<QuizItem>>,
  clickedOptionId: string
) {
  if (draft.type === QuizItemType.Checkboxes) {
    const clickedOptionIndex = draft.options.findIndex(
      (option) => option.id === clickedOptionId
    );

    draft.options[clickedOptionIndex].correct =
      !draft.options[clickedOptionIndex].correct;
  }

  if (draft.type === QuizItemType.MultipleChoice) {
    draft.options.forEach((o) => (o.correct = o.id === clickedOptionId));
  }
}

// When switching from a checkboxes to multiple choice, we need to make sure
// we aren't left with multiple correct options (there should only be one)
function adjustOptionsToQuestionType(draft: Draft<Required<QuizItem>>) {
  if (draft.type === QuizItemType.MultipleChoice) {
    const firstCorrectOptionIndex = draft.options.findIndex((o) => o.correct);

    draft.options.forEach(
      (option, index) => (option.correct = index === firstCorrectOptionIndex)
    );
  }
}

interface QuestionDraftProps {
  index: number;
  item: QuizItem;
  updateQuestion: (updatedQuestion: QuizItem) => void;
  removeQuestion: () => void;
}

export default function QuestionDraft({
  index,
  item,
  updateQuestion,
  removeQuestion,
}: QuestionDraftProps) {
  if (!item.options) {
    console.error("Tried to render question with undefined options");
    return null;
  }

  const question = item as Required<QuizItem>;

  return (
    <QuizItemDraft
      index={index}
      itemId={question.id}
      onRemove={removeQuestion}
      extraActions={
        <Select
          value={question.type}
          size="small"
          sx={{ ml: "auto", mr: 1, width: 160 }}
          onChange={(e) => {
            const updatedQuestion = produce(question, (draft) => {
              draft.type = e.target.value as QuizItemType;
              adjustOptionsToQuestionType(draft);
            });

            updateQuestion(updatedQuestion);
          }}
        >
          <MenuItem value={QuizItemType.MultipleChoice}>
            Multiple choice
          </MenuItem>
          <MenuItem value={QuizItemType.Checkboxes}>Checkboxes</MenuItem>
        </Select>
      }
    >
      <CardContent>
        <TextField
          id="outlined-basic"
          label="Question title"
          fullWidth
          variant="outlined"
          value={question.text}
          onChange={(e) =>
            updateQuestion({ ...question, text: e.target.value })
          }
        />
      </CardContent>

      <Stack spacing={1} px={1}>
        {question.options.map((option) => (
          <OptionDraft
            key={option.id}
            questionType={question.type}
            option={option}
            onRemove={() => {
              const updatedQuestion = produce(question, (draft) => {
                const i = draft.options.findIndex((o) => o.id === option.id);
                draft.options.splice(i, 1);
              });

              updateQuestion(updatedQuestion);
            }}
            onTextChange={(e) => {
              const updatedQuestion = produce(question, (draft) => {
                const i = draft.options.findIndex((o) => o.id === option.id);
                draft.options[i].text = e.target.value;
              });

              updateQuestion(updatedQuestion);
            }}
            onToggleCorrect={() => {
              const updatedQuestion = produce(question, (draft) => {
                updateOptions(draft, option.id);
              });

              updateQuestion(updatedQuestion);
            }}
          />
        ))}

        <Button
          sx={{ mx: 1 }}
          onClick={() => {
            const newOption: Option = {
              id: uuidv4(),
              text: "",
              correct: false,
            };

            const updatedQuestion = produce(question, (draft) => {
              draft.options.push(newOption);
            });

            updateQuestion(updatedQuestion);
          }}
        >
          + Add option
        </Button>
      </Stack>
    </QuizItemDraft>
  );
}
