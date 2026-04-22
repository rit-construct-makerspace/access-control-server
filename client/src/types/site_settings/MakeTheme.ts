import { createTheme, Theme, ThemeOptions } from "@mui/material";
import { RegisteredTheme } from "./ThemeController";

export interface ServerThemeData {
  key: string; // Unique key that idnetifies this theme to the Theme Controller
  themeName: string; // Name to display where this theme appears to the user
  title: string; // Site title under this theme, for RIT: "Make @ RIT"
  muiThemeOptions: ThemeOptions;
  logo: string;
  default: boolean;
}

export class MakeTheme implements RegisteredTheme, ServerThemeData {
  key: string;
  themeName: string;
  title: string;
  muiThemeOptions: ThemeOptions;
  logo: string;
  default: boolean;

  constructor(serverData: ServerThemeData) {
    this.key = serverData.key;
    this.themeName = serverData.themeName;
    this.title = serverData.title;
    this.muiThemeOptions = serverData.muiThemeOptions;
    this.logo = serverData.logo;
    this.default = serverData.default;
  }

  getTheme(): Theme {
    return createTheme({
      ...this.muiThemeOptions,
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
  }
  getThemeName(): string {
    return this.key;
  }
}