/** SubmissionRepository.ts
 * DB operations endpoint for ModuleSubmissions table
 */

import { knex } from "../../db/index.js";
import { ModuleSubmissionRow } from "../../db/tables.js";
import { EntityNotFound } from "../../EntityNotFound.js";

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
    passed: boolean
) {
    return await knex("ModuleSubmissions").insert({ makerID, moduleID, passed }).returning('id');
}

/**
 * Fetch a submission by it's ID
 * @param submissionID the unique ID of the submission
 * @returns the submission
 */
export async function getSubmission(
    submissionID: number
): Promise<ModuleSubmissionRow | undefined>  {
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
