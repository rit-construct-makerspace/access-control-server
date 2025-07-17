import { knex } from "../../db/index.js";


export async function addPassedModule(userID: number, moduleID: number) {
    return await knex("PassedModules").upsert({userID: userID, moduleID: moduleID});
}

export async function removePassedModule(userID: number, moduleID: number) {
    return await knex("PassedModules").delete().where("userID", userID).andWhere("moduleID", moduleID);
}

export async function getPassedModuleIDs(userID: number) {
    return await knex("PassedModules").select("*").where("userID", userID);
}