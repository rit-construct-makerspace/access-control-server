import DeleteIcon from '@mui/icons-material/Delete';
import ActionButton from "./ActionButton";

interface DeleteButtonProps {
  appearance: "icon-only" | "small" | "medium" | "large";
  handleClick: () => Promise<void>;
  loading: boolean;
  tooltipText: string;
}

export default function DeleteButton(props: DeleteButtonProps) {
  return (
    <ActionButton
      iconSize={25}
      tooltipText={props.tooltipText}
      buttonText="Delete"
      appearance={props.appearance}
      color="error"
      handleClick={props.handleClick}
      loading={props.loading}
    >
      <DeleteIcon />
    </ActionButton>
  )
}