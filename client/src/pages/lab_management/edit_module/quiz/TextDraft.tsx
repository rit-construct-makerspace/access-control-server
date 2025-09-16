import React, { useCallback } from "react";
import QuizItemDraft from "./QuizItemDraft";
import { TextField } from "@mui/material";
import { QuizItem } from "../../../../types/Quiz";

interface TextDraftProps {
  index: number;
  item: QuizItem;
  updateText: (updatedText: QuizItem) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export default function TextDraft({
  index,
  item,
  updateText,
  onRemove,
  onDuplicate,
}: TextDraftProps) {
  
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateText({ ...item, text: e.target.value });
  }, [updateText, item]);

  return (
    <QuizItemDraft onRemove={onRemove} onDuplicate={onDuplicate} index={index} itemId={item.id}>
      <TextField
        multiline
        sx={{ m: 2 }}
        label="Text"
        onChange={onChange}
        value={item.text}
      />
    </QuizItemDraft>
  );
}
