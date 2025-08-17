import { useEffect, useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { ThemeController } from "../Theme";


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
        <LightModeIcon /> Light
      </ToggleButton>
      <ToggleButton value={"dark"}>
        <DarkModeIcon /> Dark
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
