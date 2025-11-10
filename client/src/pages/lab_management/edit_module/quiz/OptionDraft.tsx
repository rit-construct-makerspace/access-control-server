import { ChangeEventHandler } from "react";
import { IconButton, Stack, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { Option, QuizItemType } from "../../../../types/Quiz";

interface OptionDraftProps {
  questionType: QuizItemType;
  option: Option;
  onRemove: () => void;
  onTextChange: ChangeEventHandler<HTMLInputElement>;
  onToggleCorrect: () => void;
}

function getCorrectIcon(questionType: QuizItemType, correct: boolean) {
  if (questionType === QuizItemType.MultipleChoice) {
    return correct ? <RadioButtonCheckedIcon /> : <RadioButtonUncheckedIcon />;
  }

  if (questionType === QuizItemType.Checkboxes) {
    return correct ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />;
  }
}

export default function OptionDraft({
  questionType,
  option,
  onRemove,
  onTextChange,
  onToggleCorrect,
}: OptionDraftProps) {
  return (
    <Stack direction="row" alignItems="center">
      <IconButton size="small" onClick={onToggleCorrect}>
        {getCorrectIcon(questionType, option.correct)}
      </IconButton>

      <TextField
        id="outlined-basic"
        fullWidth
        variant="standard"
        size="small"
        placeholder="Enter option text"
        value={option.text}
        onChange={onTextChange}
        sx={{ mx: 1 }}
      />

      <IconButton size="small" onClick={onRemove}>
        <CloseIcon />
      </IconButton>
    </Stack>
  );
}
