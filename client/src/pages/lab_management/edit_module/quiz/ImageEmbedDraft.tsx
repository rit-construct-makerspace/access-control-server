import React from "react";
import styled from "styled-components";
import QuizItemDraft from "./QuizItemDraft";
import { Stack, TextField } from "@mui/material";
import { QuizItem } from "../../../../types/Quiz";
import FileUploadButton from "../../../../common/FileUploadButton";

const StyledImage = styled.img`
  border-radius: 4px;
`;

interface ImageEmbedDraftProps {
  index: number;
  imageEmbed: QuizItem;
  updateImageEmbed: (updatedImageEmbed: QuizItem) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export default function ImageEmbedDraft({
  index,
  imageEmbed,
  updateImageEmbed,
  onRemove,
  onDuplicate,
}: ImageEmbedDraftProps) {
  return (
    <QuizItemDraft onRemove={onRemove} onDuplicate={onDuplicate} index={index} itemId={imageEmbed.id}>
      <Stack padding={2} spacing={2}>
        <FileUploadButton
          color="info"
          variant="contained"
          text="Upload Image"
          onUpload={(name: string) => updateImageEmbed({ ...imageEmbed, text: import.meta.env.VITE_CDN_URL + "user-uploads/" + name })}
        />
        {imageEmbed.text && <StyledImage src={imageEmbed.text} alt="" />}
      </Stack>
    </QuizItemDraft>
  );
}
