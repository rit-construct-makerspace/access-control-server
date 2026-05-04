import { IconButton, InputAdornment, StandardTextFieldProps, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

interface SearchBarProps extends StandardTextFieldProps {
  onSubmit?: () => void;
  onClear?: () => void;
  hideClearButton?: boolean;
  value?: string;
}

export default function SearchBar({
  onSubmit,
  onClear,
  hideClearButton,
  ...props
}: SearchBarProps) {
  return (
    <TextField
      id="search"
      placeholder="Search"
      size="small"
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          endAdornment: props.value && !hideClearButton ? (
            <InputAdornment position="end">
              <IconButton onClick={onClear} sx={{ mr: -1 }}>
                <CloseIcon />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSubmit?.();
      }}
      {...props}
      sx={{ width: 300, ...props.sx }}
    />
  );
}
