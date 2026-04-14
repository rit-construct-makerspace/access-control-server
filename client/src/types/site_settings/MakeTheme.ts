import { createTheme, Theme, ThemeOptions } from "@mui/material";
import { RegisteredTheme } from "./ThemeController";

export interface ServerThemeData {
  key: string; // Unique key that idnetifies this theme to the Theme Controller
  themeName: string; // Name to display where this theme appears to the user
  title: string; // Site title under this theme, for RIT: "Make @ RIT"
  muiThemeOptions: ThemeOptions;
}

export class MakeTheme implements RegisteredTheme, ServerThemeData {
  key: string;
  themeName: string;
  title: string;
  muiThemeOptions: ThemeOptions;

  constructor(serverData: ServerThemeData) {
    this.key = serverData.key;
    this.themeName = serverData.themeName;
    this.title = serverData.title;
    this.muiThemeOptions = serverData.muiThemeOptions;
  }

  getTheme(): Theme {
    return createTheme(this.muiThemeOptions);
  }
  getThemeName(): string {
    return this.key;
  }
}