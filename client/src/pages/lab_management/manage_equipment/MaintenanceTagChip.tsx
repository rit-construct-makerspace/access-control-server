import { Chip, Stack } from "@mui/material";
import { useState } from "react";
import CircleIcon from '@mui/icons-material/Circle';
import CancelIcon from '@mui/icons-material/Cancel';

const CHIP_COLORS: ("default" | "primary" | "secondary" | "warning" | "info" | "error" | "success")[] = ["primary", "secondary", "warning", "info", "error", "success"];

export default function MaintenanceTagChip(props: { id: number, label: string, color: string, removeTag: (id: number) => void}) {

  const [isHover, setIsHover] = useState(false);

  function handleMouseEnter() {
    setIsHover(true)
  }

  function handleMouseLeave() {
    setIsHover(false)
  }

  return (
    <Chip 
      variant={ isHover ? "filled" : "outlined" }
      color={props.color as ("default" | "primary" | "secondary" | "warning" | "info" | "error" | "success")} 
      size="small"
      label={<Stack direction={"row"} alignItems={"center"}>{isHover ? <CancelIcon onClick={() => props.removeTag(props.id)} sx={{fontSize: "1.1em", mr: 0.5, cursor: "pointer"}} /> : <CircleIcon sx={{fontSize: "1.1em", mr: 0.5}} />} {props.label}</Stack>}
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onBlur={handleMouseLeave} /> 
  );
}
