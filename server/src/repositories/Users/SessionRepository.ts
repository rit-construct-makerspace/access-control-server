import { knex } from "../../db/index.js";
import { ExpressSessionRow } from "../../db/tables.js";


export async function getSession(sid: string): Promise<ExpressSessionRow | undefined> {
  return await knex("ExpressSessions").select("*").where("sid", sid).first();
}

export async function setSession(sid: string, session: string) {
  return await knex("ExpressSessions").insert({ sid: sid, session: session }).onConflict("sid").merge();
}

export async function deleteSession(sid: string) {
  return await knex("ExpressSessions").where("sid", sid).delete();
}