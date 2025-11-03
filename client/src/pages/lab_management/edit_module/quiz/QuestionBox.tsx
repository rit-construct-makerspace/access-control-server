import { memo, ReactElement } from "react";
import { QuizItem, QuizItemType } from "../../../../types/Quiz";
import ImageEmbedDraft from "./ImageEmbedDraft";
import PdfEmbedDraft from "./PdfEmbedDraft";
import QuestionDraft from "./QuestionDraft";
import TextDraft from "./TextDraft";
import YouTubeEmbedDraft from "./YouTubeEmbedDraft";

interface QuestionBoxProps {
    item: QuizItem, index: number,
    duplicateItem: (item: QuizItem) => void,
    updateItem: (updatedItem: QuizItem) => void,
    handleRemove: (itemId: string) => void
}

const QuestionBox = memo(function QuestionBox(
    { item,
        index,
        duplicateItem,
        updateItem,
        handleRemove
    }: QuestionBoxProps): ReactElement {

    switch (item.type) {
        case QuizItemType.MultipleChoice:
        case QuizItemType.Checkboxes:
            return (
                <QuestionDraft
                    key={item.id}
                    index={index}
                    item={item}
                    updateQuestion={updateItem}
                    removeQuestion={handleRemove}
                    duplicateQuestion={duplicateItem}
                />
            );
        case QuizItemType.Text:
            return (
                <TextDraft
                    key={item.id}
                    index={index}
                    item={item}
                    updateText={updateItem}
                    onRemove={handleRemove}
                    onDuplicate={duplicateItem}
                />
            );
        case QuizItemType.YoutubeEmbed:
            return (
                <YouTubeEmbedDraft
                    key={item.id}
                    index={index}
                    youtubeEmbed={item}
                    updateYoutubeEmbed={updateItem}
                    onRemove={handleRemove}
                    onDuplicate={duplicateItem}
                />
            );
        case QuizItemType.ImageEmbed:
            return (
                <ImageEmbedDraft
                    key={item.id}
                    index={index}
                    imageEmbed={item}
                    updateImageEmbed={updateItem}
                    onRemove={handleRemove}
                    onDuplicate={duplicateItem}
                />
            );
        case QuizItemType.PdfEmbed:
            return (
                <PdfEmbedDraft
                    key={item.id}
                    index={index}
                    pdfEmbed={item}
                    updatepdfEmbed={updateItem}
                    onRemove={handleRemove}
                    onDuplicate={duplicateItem}
                />
            );
        default:
            return <div></div>;
    }
});


export default QuestionBox;