import { useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { ThemeController } from "../types/site_settings/ThemeController";


export default function ThemeToggle() {
  const [curTheme, setCurTheme] = useState(ThemeController.activeTheme.themeName);

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
      {
        ThemeController.registeredThemes.entries().map((themeEntry) => (
          <ToggleButton value={themeEntry[0]}>
            {themeEntry[1].themeName}
          </ToggleButton>
        ))
      }
    </ToggleButtonGroup>
  );
}
