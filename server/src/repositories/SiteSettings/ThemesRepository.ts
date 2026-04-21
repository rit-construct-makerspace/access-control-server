import { knex } from "../../db/index.js";
import { ThemeRow } from "../../db/tables.js";

export async function getThemes(): Promise<ThemeRow[]> {
  return await knex("Themes").select("*").orderBy("id", "asc");
}

export async function createNewTheme(themeName: string, title: string, muiThemeOptions: object, logo: string): Promise<ThemeRow> {
  const result = await knex("Themes").insert({ themeName: themeName, title: title, muiThemeOptions: muiThemeOptions, logo: logo }).returning("*");
  return result[0];
}

export async function getThemeByID(id: number): Promise<ThemeRow | undefined> {
  return await knex("Themes").where({ id: id }).first();
}

export async function updateTheme(id: number, themeName: string, title: string, muiThemeOptions: object, logo: string): Promise<ThemeRow> {
  console.log("updating w/ logo: ", logo)
  const result = await knex("Themes").where({ id: id }).update({
    themeName: themeName,
    title: title,
    muiThemeOptions: muiThemeOptions,
    logo: logo
  }).returning("*");

  return result[0];
}