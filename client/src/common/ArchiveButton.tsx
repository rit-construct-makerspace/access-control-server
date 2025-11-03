import ArchiveIcon from "@mui/icons-material/Archive";
import ActionButton from "./ActionButton";

interface ArchiveButtonProps {
  appearance: "icon-only" | "small" | "medium" | "large";
  handleClick: () => Promise<void>;
  loading: boolean;
  tooltipText: string;
}

export default function ArchiveButton(props: ArchiveButtonProps) {
  return (
    <ActionButton
      iconSize={25}
      tooltipText={props.tooltipText}
      buttonText="Hide"
      appearance={props.appearance}
      color="primary"
      handleClick={props.handleClick}
      loading={props.loading}
    >
      <ArchiveIcon />
    </ActionButton>
  );
}
