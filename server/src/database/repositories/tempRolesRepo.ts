import { knex } from "../knex/index.js";



export async function insertTempRole(name: string): Promise<void> {
  await knex("RolesTemp").insert({ name });
}