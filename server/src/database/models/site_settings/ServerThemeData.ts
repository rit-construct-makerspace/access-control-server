export interface ServerThemeData {
  key: string; // Unique key that idnetifies this theme to the Theme Controller
  themeName: string; // Name to display where this theme appears to the user
  title: string; // Site title under this theme, for RIT: "Make @ RIT"
  muiThemeOptions: object; // mui ThemeOptions tpye on the frontend
}