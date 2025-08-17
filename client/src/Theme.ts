import { createTheme, Theme } from "@mui/material";

interface MakeTheme {
  getTheme(): Theme;
  getThemeString(): string;
}

class LightTheme implements MakeTheme {
  private static readonly theme = createTheme({
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
  });

  getTheme(): Theme {
    return LightTheme.theme;
  }

  getThemeString(): string {
    return "light";
  }
}

class DarkTheme implements MakeTheme {
  private static readonly theme = createTheme({
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
      mode: "dark"
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
  });

  getTheme(): Theme {
    return DarkTheme.theme;
  }

  getThemeString(): string {
    return "dark";
  }
}

export class ThemeController {
  static activeTheme: MakeTheme = this.evaluateThemeString(localStorage.getItem("themeMode") ?? "light");
  static themeWatchers: ((theme: Theme) => void)[] = [];
  static stringWatchers: ((theme: string) => void)[] = []

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
      watcher(this.activeTheme.getThemeString());
    })
  }

  static setActiveTheme(theme: string) {
    this.activeTheme = this.evaluateThemeString(theme);
    localStorage.setItem("themeMode", this.activeTheme.getThemeString());
    this.notifyThemeWatchers();
    this.notifyStringWatchers();
  }

  private static evaluateThemeString(themeString: string) {
    switch (themeString) {
      case "light":
        return new LightTheme();
      case "dark":
        return new DarkTheme();
      default:
        return new LightTheme();
    }
  }
}
