/**
 * TrainingHoldsRepository.ts
 * DB Operations for Training Holds
 */

import { knex } from "../../knex/index.js";
import { TrainingHoldsRow } from "../../knex/tables.js";

/**
 * Fetch Training Holds
 * @returns all Training Holds
 */
export async function getTrainingHolds(): Promise<TrainingHoldsRow[]> {
    return await knex("TrainingHolds").select();
}

/**
 * Fetch Training Holds by affected user
 * @param userID ID of user to filter by
 * @returns all matching Training Holds
 */
export async function getTrainingHoldsByUser(userID: number): Promise<TrainingHoldsRow[]> {
    return await knex("TrainingHolds").select().where({ userID }).andWhere("expires", ">=", knex.fn.now());
}

/**
 * Fetch Training Hold by affected user and affected module
 * @param userID ID of user to filter by
 * @param moduleID ID of training module to filter by
 * @returns Training Hold or undefined if not found
 */
export async function getTrainingHoldByUserForModule(userID: number, moduleID: number): Promise<TrainingHoldsRow | undefined> {
    return await knex("TrainingHolds").select().where({ userID, moduleID }).andWhere("expires", ">=", knex.fn.now()).first();
}

/**
 * Fetch Training Hold by ID
 * @param id ID of Training Hold
 * @returns Training Hold or undefined if ID not exist
 */
export async function getTrainingHoldByID(id: number): Promise<TrainingHoldsRow | undefined> {
    return await knex("TrainingHolds").select().where({ id }).first();
}

/**
 * Insert a new Training Hold into the table
 * @param userID ID of affected user
 * @param moduleID ID of affected training module
 * @param expires date hold should expire
 * @returns true
 */
export async function createTrainingHold(userID: number, moduleID: number, expires?: Date): Promise<boolean> {
    if (!expires) {
        expires = new Date();
        expires.setDate(expires.getDate() + 1);
        expires.setHours(0);
        expires.setMinutes(0);
        expires.setSeconds(0);
    }
    await knex("TrainingHolds").insert({ userID, moduleID, expires });
    return true;
}

/**
 * Delete any Training Hold in the table who's "expires" data has passed
 * @returns true
 */
export async function deleteExpiredTrainingHolds(): Promise<boolean> {
    await knex("TrainingHolds").delete().where("expires", "<", knex.fn.now());
    return true;
}

/**
 * Delete a Training Hold
 * @param id ID of Training Hold to delete
 * @returns true
 */
export async function deleteTrainingHold(id: number): Promise<boolean> {
    await knex("TrainingHolds").delete().where({ id });
    return true;
}

/**
 * Purge all expired Training Holds and then fetch remaining Training Holds for the noted user
 * @param userID ID of user to filter by
 * @returns all active Training Holds affecting the noted user
 */
export async function getActiveTrainingHoldsByUser(userID: number): Promise<TrainingHoldsRow[]> {
    return await deleteExpiredTrainingHolds().then(async () => {
        return await getTrainingHoldsByUser(userID);
    });
}