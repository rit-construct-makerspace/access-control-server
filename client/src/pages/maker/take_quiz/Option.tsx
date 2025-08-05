import { QuizItemType } from "../../../types/Quiz";
import { IconButton, Stack, Typography } from "@mui/material";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";

function getCorrectIcon(type: QuizItemType, selected: boolean) {
  if (type === QuizItemType.MultipleChoice) {
    return selected ? <RadioButtonCheckedIcon /> : <RadioButtonUncheckedIcon />;
  }

  if (type === QuizItemType.Checkboxes) {
    return selected ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />;
  }
}

interface OptionProps {
  type: QuizItemType;
  text: string;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}

export default function Option({ type, text, selected, onClick, disabled }: OptionProps) {
  return (
    <Stack direction="row" alignItems="center">
      <IconButton size="small" onClick={onClick} disabled={disabled}>
        {getCorrectIcon(type, selected)}
      </IconButton>

      <Typography onClick={onClick} sx={{ flex: 1, cursor: "pointer" }}>
        {text}
      </Typography>
    </Stack>
  );
}
