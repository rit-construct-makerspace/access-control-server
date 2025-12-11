import { Button, CircularProgress, IconButton, Tooltip } from "@mui/material";

interface ActionButtonProps {
  iconSize: number;
  buttonText?: string;
  tooltipText?: string;
  color: "error" | "inherit" | "primary" | "secondary" | "info" | "success" | "warning";
  appearance: "icon-only" | "small" | "medium" | "large";
  handleClick: () => Promise<void>;
  loading: boolean;
  disabled?: boolean
  variant?: "text" | "outlined" | "filled";
}

export default function ActionButton(props: React.PropsWithChildren<ActionButtonProps>) {
  let size: "small" | "medium" | "large";
  switch(props.appearance) {
    case "large":
      size = "large"
      break;
    case "medium":
      size = "medium"
      break;
    default:
      size = "small"
  }

  const handleClick = async (e: any) => {
    e.stopPropagation();
    await props.handleClick();
  }

  return (
    <Tooltip
      title={props.tooltipText ? props.tooltipText : ""}
      arrow
      PopperProps={{
        modifiers: [
            {
                name: "offset",
                options: {
                    offset: [0, 0],
                },
            },
        ],
      }}
      onClick={handleClick}
    >
      {
        props.appearance === "icon-only"
          ? (
            <IconButton
              disabled={props.disabled}
              color={props.color}
              onClick={handleClick}
              sx={{
                width: props.iconSize + 15,
                height: props.iconSize + 15
              }}
            >
              {
                props.loading
                  ? <CircularProgress
                        color={props.color}
                        size={props.iconSize}
                        />
                  : props.children
              }
            </IconButton>
            )
          : (
              <Button
                disabled={props.disabled}
                loading={props.loading}
                variant="contained"
                startIcon={props.children}
                color={props.color}
                onClick={handleClick}
                loadingPosition="start"
                size={size}
              >
                { props.buttonText }
              </Button>
            )
      }
    </Tooltip>
  );
}
