import { knex } from "../../knex/index.js";


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
  const result = await knex.raw('DELETE FROM "PassedModules" using "TrainingModule" tm where "moduleID"  = tm.id  and "passedDate" <= NOW() - INTERVAL \'365 days \' and tm.expires is true returning *');
  return result.rows.length;
}

export async function getPassedTrainingsDaysAgo(days: number): Promise<{ email: string, moduleIds: number[], moduleNames: string[] }[]> {
  const result = await knex.raw(`
select
	CONCAT(u."ritUsername", '@rit.edu') as email,
	array_agg(pm."moduleID") as "moduleIds", 
	array_agg(tm."name") as "moduleNames"
from "PassedModules" pm 
left join "Users" u on pm."userID" = u.id 
left join "TrainingModule" tm on pm."moduleID"  = tm.id 
where "passedDate" <= NOW() - INTERVAL '${days} days' 
and tm.expires is true
group by u."ritUsername";`)

  return result.rows;
}