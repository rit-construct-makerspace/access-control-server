import { knex } from "../../knex/index.js";
import { ThemeRow } from "../../knex/tables.js";

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
  const result = await knex("Themes").where({ id: id }).update({
    themeName: themeName,
    title: title,
    muiThemeOptions: muiThemeOptions,
    logo: logo
  }).returning("*");

  return result[0];
}

export async function markDefaultTheme(id: number): Promise<boolean> {
  await knex("Themes").update({ default: false });
  await knex("Themes").where({ id: id }).update({ default: true });
  return true;
}

export async function deleteTheme(id: number): Promise<boolean> {
  await knex("Themes").where({ id: id }).delete();
  return true;
}