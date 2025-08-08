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

interface QuizBuilderProps {
  quiz: QuizItem[];
  handleAdd: any
  handleRemove: any
  handleUpdate: any
  handleOnDragEnd: any
}

export default function QuizBuilder({ quiz, handleAdd, handleRemove, handleUpdate, handleOnDragEnd }: QuizBuilderProps) {

  const addItem = (item: QuizItem) =>
    handleAdd(item)

  const removeItem = (itemId: string) =>
    handleRemove(itemId)

  const duplicateItem = (item: QuizItem) => {
    addItem({
      id: uuidv4(),
      type: item.type,
      text: item.text,
      options: item.options,
    });
  }

  const updateItem = (itemId: string, updatedItem: QuizItem) =>
    handleUpdate(itemId, updatedItem)

  const createQuestion = () =>
    addItem({
      id: uuidv4(),
      type: QuizItemType.MultipleChoice,
      text: "",
      options: [],
    });

  const createText = () =>
    addItem({
      id: uuidv4(),
      type: QuizItemType.Text,
      text: "",
    });

  const createYoutubeEmbed = () =>
    addItem({
      id: uuidv4(),
      type: QuizItemType.YoutubeEmbed,
      text: "",
    });

  const createImageEmbed = () =>
    addItem({
      id: uuidv4(),
      type: QuizItemType.ImageEmbed,
      text: "",
    });

  const createPdfEmbed = () =>
    addItem({
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
              {quiz.map((item, index) => {
                switch (item.type) {
                  case QuizItemType.MultipleChoice:
                  case QuizItemType.Checkboxes:
                    return (
                      <QuestionDraft
                        key={item.id}
                        index={index}
                        item={item}
                        updateQuestion={(updatedQuestion) =>
                          updateItem(item.id, updatedQuestion)
                        }
                        removeQuestion={() => removeItem(item.id)}
                        duplicateQuestion={() => duplicateItem(item)}
                      />
                    );
                  case QuizItemType.Text:
                    return (
                      <TextDraft
                        key={item.id}
                        index={index}
                        item={item}
                        updateText={(updatedText) => {
                          updateItem(item.id, updatedText);
                        }}
                        onRemove={() => removeItem(item.id)}
                        onDuplicate={() => duplicateItem(item)}
                      />
                    );
                  case QuizItemType.YoutubeEmbed:
                    return (
                      <YouTubeEmbedDraft
                        key={item.id}
                        index={index}
                        youtubeEmbed={item}
                        updateYoutubeEmbed={(updatedYoutubeEmbed) => {
                          updateItem(item.id, updatedYoutubeEmbed);
                        }}
                        onRemove={() => removeItem(item.id)}
                        onDuplicate={() => duplicateItem(item)}
                      />
                    );
                  case QuizItemType.ImageEmbed:
                    return (
                      <ImageEmbedDraft
                        key={item.id}
                        index={index}
                        imageEmbed={item}
                        updateImageEmbed={(updatedImageEmbed) => {
                          updateItem(item.id, updatedImageEmbed);
                        }}
                        onRemove={() => removeItem(item.id)}
                        onDuplicate={() => duplicateItem(item)}
                      />
                    );
                  case QuizItemType.PdfEmbed:
                    return (
                      <PdfEmbedDraft
                        key={item.id}
                        index={index}
                        pdfEmbed={item}
                        updatepdfEmbed={(updatedPdfEmbed) => {
                          updateItem(item.id, updatedPdfEmbed);
                        }}
                        onRemove={() => removeItem(item.id)}
                        onDuplicate={() => duplicateItem(item)}
                      />
                    );
                  default:
                    return null;
                }
              })}
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
