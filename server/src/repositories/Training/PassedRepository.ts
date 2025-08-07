import { knex } from "../../db/index.js";


export async function addPassedModule(userID: number, moduleID: number, passedDate: Date) {
  return await knex("PassedModules").insert({ userID: userID, moduleID: moduleID, passedDate: passedDate }).onConflict(["userID", "moduleID"]).merge();
}

export async function deletePassedModule(userID: number, moduleID: number) {
  return await knex("PassedModules").delete().where("userID", userID).andWhere("moduleID", moduleID);
}

export async function getPassedModuleIDs(userID: number) {
  return await knex("PassedModules").select("*").where("userID", userID);
}

export async function purgeExpiredPassedModules(): Promise<number> {
  const result = await knex("PassedModules").delete().where("passedDate", "<=", "NOW() - INTERVAL '1 year'").returning("*");
  return result.length;
}

export async function getPassedTrainingsWeeksAgo(weeks: number): Promise<{ userID: number, modules: number[] }> {
  const result = await knex.raw(`select "userID", array_agg("moduleID") as modules from "PassedModules" where "passedDate" <= NOW() - INTERVAL '${weeks} weeks' group by "userID"`)

  return result.rows;
}