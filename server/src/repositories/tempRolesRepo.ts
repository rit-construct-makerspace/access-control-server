import { knex } from "../db/index.js";



export async function insertTempRole(name: string): Promise<void> {
  await knex("RolesTemp").insert({ name });
}