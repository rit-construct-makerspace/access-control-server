import { v4 as uuidv4 } from "uuid";
import QuestionDraft from "./QuestionDraft";
import { Button, ButtonGroup, Stack } from "@mui/material";
import ContactSupportIcon from "@mui/icons-material/ContactSupport";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import ImageIcon from "@mui/icons-material/Image";
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import YouTubeEmbedDraft from "./YouTubeEmbedDraft";
import ImageEmbedDraft from "./ImageEmbedDraft";
import TextDraft from "./TextDraft";
import { QuizItem, QuizItemType } from "../../../../types/Quiz";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import EmptyPageSection from "../../../../common/EmptyPageSection";
import PdfEmbedDraft from "./PdfEmbedDraft";
import { useCallback } from "react";

interface QuizBuilderProps {
  quiz: QuizItem[];
  handleAdd: (item: QuizItem) => void;
  handleRemove: (itemId: string) => void;
  handleUpdate: (itemId: string, updatedItem: QuizItem) => void;
  handleOnDragEnd: (result: DropResult) => void;
}


function MakeBox(item: QuizItem, index: number, duplicateItem: (item: QuizItem) => void, updateItem: (itemId: string, updatedItem: QuizItem) => void, handleRemove: (itemId: string) => void) {
  const update = useCallback((newItem: QuizItem) => updateItem(item.id, newItem), [updateItem]);
  const remove = useCallback(() => handleRemove(item.id), [handleRemove, item]);
  const duplicate = useCallback(() => duplicateItem(item), [duplicateItem, item]);

  switch (item.type) {
    case QuizItemType.MultipleChoice:
    case QuizItemType.Checkboxes:
      return (
        <QuestionDraft
          key={item.id}
          index={index}
          item={item}
          updateQuestion={updateItem}
          removeQuestion={remove}
          duplicateQuestion={duplicate}
        />
      );
    case QuizItemType.Text:
      return (
        <TextDraft
          key={item.id}
          index={index}
          item={item}
          updateText={update}
          onRemove={remove}
          onDuplicate={duplicate}
        />
      );
    case QuizItemType.YoutubeEmbed:
      return (
        <YouTubeEmbedDraft
          key={item.id}
          index={index}
          youtubeEmbed={item}
          updateYoutubeEmbed={update}
          onRemove={remove}
          onDuplicate={duplicate}
        />
      );
    case QuizItemType.ImageEmbed:
      return (
        <ImageEmbedDraft
          key={item.id}
          index={index}
          imageEmbed={item}
          updateImageEmbed={update}
          onRemove={remove}
          onDuplicate={duplicate}
        />
      );
    case QuizItemType.PdfEmbed:
      return (
        <PdfEmbedDraft
          key={item.id}
          index={index}
          pdfEmbed={item}
          updatepdfEmbed={update}
          onRemove={remove}
          onDuplicate={duplicate}
        />
      );
    default:
      return null;
  }
}



export default function QuizBuilder({ quiz, handleAdd, handleRemove, handleUpdate, handleOnDragEnd }: QuizBuilderProps) {

  const duplicateItem = (item: QuizItem) => {
    handleAdd({
      id: uuidv4(),
      type: item.type,
      text: item.text,
      options: item.options,
    });
  }

  const createQuestion = () =>
    handleAdd({
      id: uuidv4(),
      type: QuizItemType.MultipleChoice,
      text: "",
      options: [],
    });

  const createText = () =>
    handleAdd({
      id: uuidv4(),
      type: QuizItemType.Text,
      text: "",
    });

  const createYoutubeEmbed = () =>
    handleAdd({
      id: uuidv4(),
      type: QuizItemType.YoutubeEmbed,
      text: "",
    });

  const createImageEmbed = () =>
    handleAdd({
      id: uuidv4(),
      type: QuizItemType.ImageEmbed,
      text: "",
    });

  const createPdfEmbed = () =>
    handleAdd({
      id: uuidv4(),
      type: QuizItemType.PdfEmbed,
      text: "",
    });

  const onDragEnd = (result: DropResult) =>
    handleOnDragEnd(result)

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Stack alignItems="center">
        <Droppable droppableId="droppable">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {quiz.map((item, index) => MakeBox(item, index, duplicateItem, handleUpdate, handleRemove))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {!quiz.length && (
          <EmptyPageSection
            label="Add items via the buttons below."
            sx={{ mb: 2, alignSelf: "stretch" }}
          />
        )}

        <ButtonGroup fullWidth sx={{ width: 600, backgroundColor: "white" }}>
          <Button sx={{ fontSize: 13 }} startIcon={<ContactSupportIcon />} onClick={createQuestion}>
            Question
          </Button>

          <Button sx={{ fontSize: 13 }} startIcon={<TextFieldsIcon />} onClick={createText}>
            Text
          </Button>

          <Button sx={{ fontSize: 13 }} startIcon={<YouTubeIcon />} onClick={createYoutubeEmbed}>
            Video
          </Button>

          <Button sx={{ fontSize: 13 }} startIcon={<ImageIcon />} onClick={createImageEmbed}>
            Image
          </Button>

          <Button sx={{ fontSize: 13 }} startIcon={<DocumentScannerIcon />} onClick={createPdfEmbed}>
            PDF
          </Button>
        </ButtonGroup>
      </Stack>
    </DragDropContext>
  );
}
