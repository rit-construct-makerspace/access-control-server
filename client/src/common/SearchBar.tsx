import React from "react";
import { IconButton, InputAdornment, StandardTextFieldProps, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

export function searchFilter<T>(
  searchText: string,
  collection: T[],
  getter: (x: T) => string
): T[] {
  return collection.filter((x: any) =>
    getter(x).toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
  );
}

interface SearchBarProps extends StandardTextFieldProps {
  onSubmit?: () => void;
  onClear?: () => void;
  hideClearButton?: boolean;
}

export default function SearchBar({
  onSubmit,
  onClear,
  hideClearButton,
  ...props
}: SearchBarProps) {
  const startAdornment = (
    <InputAdornment position="start">
      <SearchIcon />
    </InputAdornment>
  );

  // If there is text in the search bar,
  // render an X button
  const inputProps =
    props.value && !hideClearButton
      ? {
          startAdornment,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={onClear} sx={{ mr: -1 }}>
                <CloseIcon />
              </IconButton>
            </InputAdornment>
          ),
        }
      : { startAdornment };

  return (
    <TextField
      id="search"
      placeholder="Search"
      size="small"
      InputProps={inputProps}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSubmit?.();
        if (e.key === "Escape") onClear?.();
      }}
      {...props}
      sx={{ width: 300, ...props.sx }}
    />
  );
}
