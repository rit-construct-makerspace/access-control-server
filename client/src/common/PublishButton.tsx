import PublishIcon from '@mui/icons-material/Publish';
import ActionButton from "./ActionButton";

interface PublishEquipmentButtonProps {
  appearance: "icon-only" | "small" | "medium" | "large";
  handleClick: () => Promise<void>;
  loading: boolean;
  tooltipText: string;
}

export default function PublishEquipmentButton(props: PublishEquipmentButtonProps) {
  return (
    <ActionButton
      iconSize={22.5}
      tooltipText={props.tooltipText}
      buttonText="Publish"
      appearance={props.appearance}
      color="success"
      handleClick={props.handleClick}
      loading={props.loading}
    >
      <PublishIcon />
    </ActionButton>
  );
}
