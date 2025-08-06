import { useState } from "react";
import {
  useLocation,
} from "react-router-dom";
import ListItemIcon from "@mui/material/ListItemIcon";
import { ListItemButton, Stack, Switch, Typography } from "@mui/material";
import DarkModeIcon from '@mui/icons-material/DarkMode';


export default function ThemeToggle() {
  const url = useLocation();
  const [mode, setMode] = useState(localStorage.getItem("themeMode") == "dark")

  return (
    <ListItemButton sx={{height: "4em"}} onClick={(e) => {
      if (url.pathname.includes("/maker/training/") && !url.pathname.includes("results") && !window.confirm(
        `Are you sure you want to leave this quiz? Progress will not be saved.`
      )) {
        e.preventDefault();
        return ''
      }
      else {
        setMode(!mode);
        localStorage.setItem("themeMode", mode ? "light" : "dark");
        window.location.reload();
      }
    }}>
    <ListItemIcon><DarkModeIcon /></ListItemIcon>
      <Stack direction={"row"} alignItems="center">
        <Typography>
          Dark Mode (Experimental)
        </Typography>
        <Switch id="theme-toggle" aria-label="Dark Mode (Experimental)" checked={mode} onChange={(e) => {
          if (url.pathname.includes("/maker/training/") && !url.pathname.includes("results") && !window.confirm(
            `Are you sure you want to leave this quiz? Progress will not be saved.`
          )) {
            e.preventDefault();
            return ''
          }
          else {
            setMode(!mode);
            localStorage.setItem("themeMode", mode ? "light" : "dark");
            window.location.reload();
          }
        }}/>
      </Stack>
    </ListItemButton>
);
}
