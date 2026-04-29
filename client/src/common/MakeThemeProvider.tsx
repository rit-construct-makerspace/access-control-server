import { createContext, ReactElement, useContext, useState } from "react";
import { ThemeController } from "../types/site_settings/ThemeController";
import { MakeTheme } from "../types/site_settings/MakeTheme";

const makeThemeContext = createContext<MakeTheme | undefined>(undefined);

export function MakeThemeProvider(props: { children: ReactElement }) {
  const [makeTheme, setMakeTheme] = useState(ThemeController.activeTheme);

  ThemeController.addMakeThemeWatcher((theme) => setMakeTheme(theme));

  return (
    <makeThemeContext.Provider value={makeTheme}>
      {props.children}
    </makeThemeContext.Provider>
  );
}

export function useMakeTheme() {
  const context = useContext(makeThemeContext);

  if (context === undefined) {
    throw new Error("useMakeTheme must be used within a makeThemeContext");
  }

  return context;
}