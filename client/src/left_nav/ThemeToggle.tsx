import { useEffect, useState } from "react";
import { Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CookieIcon from '@mui/icons-material/Cookie';
import { ThemeController } from "../Theme";
import { useCurrentUser } from "../common/CurrentUserProvider";


export default function ThemeToggle() {
  const currentUser = useCurrentUser();

  const [curTheme, setCurTheme] = useState(ThemeController.activeTheme.getThemeString());

  ThemeController.addStringWatcher(setCurTheme);

  function handleChange(_event: React.MouseEvent<HTMLElement>, value: string) {
    if (value !== null && value !== curTheme) {
      ThemeController.setActiveTheme(value);
    }
  }

  return (
    <ToggleButtonGroup
      value={curTheme}
      exclusive
      onChange={handleChange}
    >
      <ToggleButton value={"light"}>
        <Stack direction={"row"} spacing={1}>
          <LightModeIcon />
          <Typography>Light</Typography>
        </Stack>
      </ToggleButton>
      <ToggleButton value={"dark"}>
        <Stack direction={"row"} spacing={1}>
          <DarkModeIcon />
          <Typography>Dark</Typography>
        </Stack>
      </ToggleButton>
      {
        currentUser.admin &&
        <ToggleButton value={"olive_garden"}>
          <Stack direction={"row"} spacing={1}>
            <CookieIcon />
            <Typography>Olive Garden</Typography>
          </Stack>
        </ToggleButton>
      }
    </ToggleButtonGroup>
  );
}
