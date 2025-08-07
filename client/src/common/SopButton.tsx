import ActionButton from "./ActionButton";
import FilePresentIcon from '@mui/icons-material/FilePresent';

interface sopButtonProps {  appearance: "icon-only" | "small" | "medium" | "large"
  url: string;
  disabled: boolean;
  toolTipText: string;
  buttonText: string;
}

export default function SopButton(props: sopButtonProps) {
  const handleClick = async () => {
    window.location.href = props.url;
  };

  return (
    <ActionButton 
      tooltipText={props.toolTipText} 
      disabled={props.disabled}
      iconSize={22.5}
      color="success"
      appearance={props.appearance}
      buttonText={props.buttonText}
      handleClick={handleClick}
      loading={false}>
        <FilePresentIcon />
    </ActionButton>
  );
}
