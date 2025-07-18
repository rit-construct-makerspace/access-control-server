/** SubmissionRepository.ts
 * DB operations endpoint for ModuleSubmissions table
 */

import { knex } from "../../db/index.js";
import { ModuleSubmissionRow } from "../../db/tables.js";
import { EntityNotFound } from "../../EntityNotFound.js";
import { getModules } from "./ModuleRepository.js";
import * as PassedRepo from "./PassedRepository.js"; 

/**
 * Create a Module SUbmission and append it to the table
 * @param makerID ID of the submitting user
 * @param moduleID ID of the attempted module
 * @param passed boolean passed the quiz
 * @returns the added submission
 */
export async function addSubmission(
    makerID: number,
    moduleID: number,
    passed: boolean,
    summary: string
) {
    if (passed) {
        PassedRepo.addPassedModule(makerID, moduleID, new Date());
    }
    return await knex("ModuleSubmissions").insert({ makerID, moduleID, passed, summary }).returning('id');
}

/**
 * Fetch a submission by it's ID
 * @param submissionID the unique ID of the submission
 * @returns the submission
 */
export async function getSubmission(
    submissionID: number
): Promise<ModuleSubmissionRow | undefined> {
    const submission = await knex("ModuleSubmissions")
        .select()
        .where(
            {
                id: submissionID
            }
        )
        .first();

    if (!submission) throw new EntityNotFound("Could not find submission id ${submissionID}");

    return submission;
}

/**
 * Fetch all submissions attempted by a user
 * @param makerID the user ID to filter by
 * @returns {ModuleSubmissionRow[]} filtered submissions
 */
export async function getSubmissionsByUser(
    makerID: number
): Promise<ModuleSubmissionRow[]> {
    const submission = await knex("ModuleSubmissions")
        .select()
        .where(
            {
                makerID: makerID,
            }
        );

    if (!submission) throw new EntityNotFound("Could not find any submissions for this user");

    return submission;
}

/**
 * Fetch all submissions entered by specified user for specified module
 * @param makerID user ID to filter by
 * @param moduleID module ID to filter by
 * @returns {ModuleSubmissionRow[]} filtered modules
 */
export async function getSubmissionsByModule(
    makerID: number,
    moduleID: number
): Promise<ModuleSubmissionRow[]> {
    return await knex("ModuleSubmissions")
        .select()
        .where(
            {
                makerID: makerID,
                moduleID: moduleID
            }
        );
}

/**
 * Fetch the most recent submission entered by specified user
 * @param makerID the user ID to filter by
 * @returns most recent module
 */
export async function getLatestSubmission(
    makerID: number
): Promise<ModuleSubmissionRow | undefined> {
    let res = await knex("ModuleSubmissions")
        .where("makerID", makerID)
        .orderBy("submissionDate", "desc")
        .first();
    return res;
}

/**
 * Fetch the most recent submission by specified user to specified module
 * @param makerID the user ID to filter by
 * @param moduleID the module ID to filter by
 * @returns most recent module by criteria
 */
export async function getLatestSubmissionByModule(
    makerID: number,
    moduleID: number
): Promise<ModuleSubmissionRow | undefined> {
    const submission = await knex("ModuleSubmissions")
        .where("makerID", makerID)
        .andWhere("moduleID", moduleID)
        .orderBy("submissionDate", "desc")
        .first();

    // if (!submission) throw new EntityNotFound("Could not find submission for module ${moduleID}");

    return submission;
}

/**
 * Fetch the number of passed and failed submissions for a specified module in a specified date range
 * @param moduleID the module ID to filter by
 * @param startDate the beginning of the search range
 * @param stopDate the end of the search range
 * @returns the count of passed and failed submissions
 */
export async function getModulePassedandFailedCount(
    moduleID: number,
    startDate: string,
    stopDate: string
): Promise<any | undefined> {
    return await knex("ModuleSubmissions").select(knex.raw(`
        SUM(CASE WHEN "passed" = TRUE THEN 1 ELSE 0 END) AS passedSum,
	    SUM(CASE WHEN "passed" = FALSE THEN 1 ELSE 0 END) AS failedSum`))
        .where({ moduleID }).andWhereBetween("submissionDate", [startDate, stopDate])
        .first();
}

/**
 * Get passed and failed counts of each module
 * @param startDate earliest date to filter by
 * @param stopDate latest date to filter by
 * @returns array of objects containing moduleID and how many times it's been passed and failed in the timeframe given
 */
export async function getModulePassedandFailedCountWithModuleName(startDate: string, stopDate: string): Promise<{ moduleID: number, moduleName: string, passedSum: number, failedSum: number }[]> {
    const result =  await getModules()
    var moduleStats: { moduleID: number, moduleName: string, passedSum: number, failedSum: number }[] = [];
    for (var i = 0; i < result.length; i++) {
        const statsResult = await getModulePassedandFailedCount(result[i].id, startDate, stopDate);
        const passedSum: number = Number(statsResult.passedsum) ?? 0;
        const failedSum: number = Number(statsResult.failedsum) ?? 0;
        moduleStats.push({ moduleID: result[i].id, moduleName: String(result[i].name), passedSum, failedSum });
    }
    return moduleStats;
    
}

/**
 * Fetch all attempts of a specified module by a specified user today
 * @param moduleID ID of module to check
 * @param userID ID of user to check
 * @returns all failed ModuleSubmissions today of the noted attributes
 */
export async function getFailedSubmissionsTodayByModuleAndUser(moduleID: number, userID: number): Promise<ModuleSubmissionRow[]> {
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0)
    return await knex("ModuleSubmissions").select().where({moduleID, makerID: userID, passed: false}).andWhere("submissionDate", ">=", today);
}