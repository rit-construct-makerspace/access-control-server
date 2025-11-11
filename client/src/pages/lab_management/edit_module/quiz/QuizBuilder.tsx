import { v4 as uuidv4 } from "uuid";
import { Button, ButtonGroup, Stack } from "@mui/material";
import ContactSupportIcon from "@mui/icons-material/ContactSupport";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import ImageIcon from "@mui/icons-material/Image";
import DocumentScannerIcon from "@mui/icons-material/DocumentScanner";
import { QuizItem, QuizItemType } from "../../../../types/Quiz";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import EmptyPageSection from "../../../../common/EmptyPageSection";
import { useCallback } from "react";
import QuestionBox from "./QuestionBox";

interface QuizBuilderProps {
  quiz: QuizItem[];
  handleAdd: (item: QuizItem) => void;
  handleRemove: (itemId: string) => void;
  handleUpdate: (updatedItem: QuizItem) => void;
  handleOnDragEnd: (result: DropResult) => void;
}

export default function QuizBuilder({
  quiz,
  handleAdd,
  handleRemove,
  handleUpdate,
  handleOnDragEnd,
}: QuizBuilderProps) {
  const update = useCallback((newItem: QuizItem) => handleUpdate(newItem), [handleUpdate]);
  const remove = useCallback((itemId: string) => handleRemove(itemId), [handleRemove]);

  const duplicateItem = useCallback(
    (item: QuizItem) => {
      handleAdd({
        id: uuidv4(),
        type: item.type,
        text: item.text,
        options: item.options,
      });
    },
    [handleAdd]
  );

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

  const onDragEnd = (result: DropResult) => handleOnDragEnd(result);

  // const update = useCallback((newItem: QuizItem) => updateItem(item.id, newItem), [updateItem, item]);
  // const remove = useCallback(() => handleRemove(item.id), [handleRemove, item]);
  // const duplicate = useCallback(() => duplicateItem(item), [duplicateItem, item]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Stack alignItems="center">
        <Droppable droppableId="droppable">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              {quiz.map((item, index) => (
                <QuestionBox
                  item={item}
                  index={index}
                  handleRemove={remove}
                  updateItem={update}
                  duplicateItem={duplicateItem}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {!quiz.length && (
          <EmptyPageSection label="Add items via the buttons below." sx={{ mb: 2, alignSelf: "stretch" }} />
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
