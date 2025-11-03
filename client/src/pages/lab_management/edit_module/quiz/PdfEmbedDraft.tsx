import styled from "styled-components";
import { Stack, TextField } from "@mui/material";
import QuizItemDraft from "./QuizItemDraft";
import { QuizItem } from "../../../../types/Quiz";

const StyledDiv = styled.div`
  border-radius: 4px;
  border: none;
  height: 1000px;
`;

interface PdfEmbedProps {
  index: number;
  pdfEmbed: QuizItem;
  updatepdfEmbed: (updatepdfEmbed: QuizItem) => void;
  onRemove: (itemId: string) => void;
  onDuplicate: (item: QuizItem) => void;
}

export default function PdfEmbedDraft({
  index,
  pdfEmbed,
  updatepdfEmbed,
  onRemove,
  onDuplicate,
}: PdfEmbedProps) {
  return (
    <QuizItemDraft onRemove={onRemove} onDuplicate={() => onDuplicate(pdfEmbed)} index={index} itemId={pdfEmbed.id}>
      <Stack padding={2} spacing={2}>
        <TextField
          label="PDF URL"
          placeholder="https://isotropic.org/papers/chicken.pdf"
          value={pdfEmbed.text}
          onChange={(e) => {
            //const embedId = new URL(e.target.value).searchParams.get("v") ?? "";
            updatepdfEmbed({ ...pdfEmbed, text: e.target.value });
          }}
        />
        {pdfEmbed.text && (
          <StyledDiv>
            <object data={pdfEmbed.text} type="application/pdf" width="100%" height="100%">
              <p><a href={pdfEmbed.text}>Embeded PDF</a></p>
            </object>
          </StyledDiv>
        )}
      </Stack>
    </QuizItemDraft>
  );
}
