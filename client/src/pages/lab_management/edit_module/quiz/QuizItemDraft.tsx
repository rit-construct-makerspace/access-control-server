import { memo, ReactNode } from "react";
import styled from "styled-components";
import { Card, CardActions, IconButton } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Draggable } from "@hello-pangea/dnd";
import { Stack } from "@mui/system";

const StyledDragHandle = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  background: #eaeaea;

  svg {
    transform: rotate(90deg);
  }
`;

interface QuizItemDraftProps {
  itemId: string;
  index: number;
  children: ReactNode;
  onRemove: (itemId: string) => void;
  onDuplicate: () => void;
  extraActions?: ReactNode;
}

const QuizItemDraft = memo(function QuizItemDraft({
  itemId,
  index,
  children,
  onRemove,
  onDuplicate,
  extraActions,
}: QuizItemDraftProps) {
  console.log("quiz item draft render", index);
  
  return (
    <Draggable draggableId={itemId} index={index}>
      {(provided, _snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          elevation={4}
          sx={{ width: "100%", minWidth: 300, maxWidth: 1200, display: "flex", mb: 4, flexGrow: 1, flexFlow: "row nowrap" }}
        >
            <StyledDragHandle {...provided.dragHandleProps}>
              <DragIndicatorIcon />
            </StyledDragHandle>

            <Stack direction="column" width={"100%"}>
              {children}

              <CardActions>
                <IconButton aria-label="Delete" onClick={() => onRemove(itemId)}>
                  <DeleteOutlineIcon />
                </IconButton>
                <IconButton aria-label="Duplicate" onClick={onDuplicate}>
                  <ContentCopyIcon />
                </IconButton>
                {extraActions}
              </CardActions>

            </Stack>
        </Card>
      )}
    </Draggable>
  );
});

export default QuizItemDraft;