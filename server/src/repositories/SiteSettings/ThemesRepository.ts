import { knex } from "../../db/index.js";
import { ThemeRow } from "../../db/tables.js";

export async function getThemes(): Promise<ThemeRow[]> {
  return await knex("Themes").select("*");
}

export async function createNewTheme(themeName: string, title: string, muiThemeOptions: object, logo: string): Promise<ThemeRow> {
  const result = await knex("Themes").insert({ themeName: themeName, title: title, muiThemeOptions: muiThemeOptions, logo: logo }).returning("*");
  return result[0];
}