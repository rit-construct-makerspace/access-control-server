import { memo } from "react";
import QuizItemDraft from "./QuizItemDraft";
import { TextField } from "@mui/material";
import { QuizItem } from "../../../../types/Quiz";

interface TextDraftProps {
  index: number;
  item: QuizItem;
  updateText: (updatedText: QuizItem) => void;
  onRemove: (itemId: string) => void;
  onDuplicate: (item: QuizItem) => void;
}

const TextDraft = memo(function TextDraft({
  index,
  item,
  updateText,
  onRemove,
  onDuplicate,
}: TextDraftProps) {

  return (
    <QuizItemDraft onRemove={onRemove} onDuplicate={()=>onDuplicate(item)} index={index} itemId={item.id}>
      <TextField
        multiline
        sx={{ m: 2 }}
        label="Text"
        onChange={(e) => updateText({ ...item, text: e.target.value })}
      value={item.text}
      />
    </QuizItemDraft>
  );
});

export default TextDraft;