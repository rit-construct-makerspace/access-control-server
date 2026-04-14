import { useState } from "react";
import { Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import { ThemeController } from "../types/site_settings/ThemeController";


export default function ThemeToggle() {
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
      <ToggleButton value={"italian_restaurant"}>
        <Stack direction={"row"} spacing={1}>
          <DinnerDiningIcon />
          <Typography>Unlimited Breadsticks</Typography>
        </Stack>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
