import { createTheme, Theme } from "@mui/material";
import { MakeTheme } from "./MakeTheme";

export abstract class RegisteredTheme {
  abstract getTheme(): Theme;
  abstract getThemeName(): string;
}

export const fallbackTheme = new MakeTheme({
  key: "fallback",
  themeName: "Fallback",
  title: "Make",
  muiThemeOptions: {
    palette: {
      primary: {
        main: "#F76902",
        dark: "#F76902",
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: "#7D55C7",
        contrastText: "#FFFFFF",
      },
      warning: {
        main: '#FFAB00',
      },
      mode: "light"
    },
    typography: {
      fontFamily: 'Roboto',
      subtitle1: {
        fontWeight: "bold",
      },
      body1: {
        fontWeight: undefined,
      },
    },
  },
  logo: ""
})

export class ThemeController {
  static activeTheme: MakeTheme = this.evaluateThemeString("");

  static themeWatchers: ((theme: Theme) => void)[] = [];
  static stringWatchers: ((theme: string) => void)[] = [];
  static makeThemeWatchers: ((theme: MakeTheme) => void)[] = [];

  static registeredThemes: Map<string, MakeTheme>;

  static addThemeWatcher(watcher: (theme: Theme) => void) {
    if (!this.themeWatchers.includes(watcher)) {
      this.themeWatchers.push(watcher);
    }
  }

  private static notifyThemeWatchers() {
    this.themeWatchers.forEach((watcher) => {
      watcher(this.activeTheme.getTheme());
    })
  }

  static addStringWatcher(watcher: (theme: string) => void) {
    if (!this.stringWatchers.includes(watcher)) {
      this.stringWatchers.push(watcher);
    }
  }

  private static notifyStringWatchers() {
    this.stringWatchers.forEach((watcher) => {
      watcher(this.activeTheme.getThemeName());
    })
  }

  static addMakeThemeWatcher(watcher: (theme: MakeTheme) => void) {
    if (!this.makeThemeWatchers.includes(watcher)) {
      this.makeThemeWatchers.push(watcher);
    }
  }

  private static notifyMakeThemeWatchers() {
    this.makeThemeWatchers.forEach((watcher) => {
      watcher(this.activeTheme);
    })
  }

  static setActiveTheme(theme: string) {
    this.activeTheme = this.evaluateThemeString(theme);
    localStorage.setItem("themeMode", this.activeTheme.getThemeName());
    this.notifyThemeWatchers();
    this.notifyStringWatchers();
    this.notifyMakeThemeWatchers();
  }

  static getActiveTheme() {
    return ThemeController.activeTheme;
  }

  static registerTheme(key: string, theme: MakeTheme) {
    ThemeController.registeredThemes.set(key, theme);
  }

  private static evaluateThemeString(themeString: string): MakeTheme {
    if (ThemeController.registeredThemes === undefined) {
      ThemeController.registeredThemes = new Map();
    }
    const result = ThemeController.registeredThemes.get(themeString);

    if (result === undefined) {
      return fallbackTheme;
    } else {
      return result;
    }
  }
}
