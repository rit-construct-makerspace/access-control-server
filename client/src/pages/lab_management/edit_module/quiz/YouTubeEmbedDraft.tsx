import styled from "styled-components";
import { Stack, TextField } from "@mui/material";
import QuizItemDraft from "./QuizItemDraft";
import { QuizItem } from "../../../../types/Quiz";

const StyledIFrame = styled.iframe`
  border-radius: 4px;
  border: none;
  height: 300px;
`;

interface YouTubeEmbedProps {
  index: number;
  youtubeEmbed: QuizItem;
  updateYoutubeEmbed: (updatedYoutubeEmbed: QuizItem) => void;
  onRemove: (itemId: string) => void;
  onDuplicate: (item: QuizItem) => void;
}

export default function YouTubeEmbedDraft({
  index,
  youtubeEmbed,
  updateYoutubeEmbed,
  onRemove,
  onDuplicate,
}: YouTubeEmbedProps) {
  return (
    <QuizItemDraft onRemove={onRemove} onDuplicate={()=>onDuplicate(youtubeEmbed)} index={index} itemId={youtubeEmbed.id}>
      <Stack padding={2} spacing={2}>
        <TextField
          label="YouTube URL"
          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          value={youtubeEmbed.text}
          onChange={(e) => {
            let embedId = ""
            try {
              embedId = new URL(e.target.value).searchParams.get("v") ?? "";
            } catch (_exc) {
              embedId = e.target.value;
            }
            updateYoutubeEmbed({ ...youtubeEmbed, text: embedId });
          }}
        />
        {youtubeEmbed.text && (
          <StyledIFrame
            src={`https://www.youtube.com/embed/${youtubeEmbed.text}`}
          />
        )}
      </Stack>
    </QuizItemDraft>
  );
}
