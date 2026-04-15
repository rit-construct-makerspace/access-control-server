import { knex } from "../../db/index.js";
import { ThemeRow } from "../../db/tables.js";

export function getThemes(): Promise<ThemeRow[]> {
  return knex("Themes").select("*");
}

