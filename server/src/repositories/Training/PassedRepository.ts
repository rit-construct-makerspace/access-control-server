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

export async function purgeExpiredPassedModules() {
    return (await knex("PassedModules").delete().where("passedDate", ">=", "NOW() - INTERVAL '1 year'").returning("*")).length;
}