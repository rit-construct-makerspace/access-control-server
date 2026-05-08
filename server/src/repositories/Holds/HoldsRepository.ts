/** HoldsRepository.ts
 * DB operations endpoint for Holds table
 */

import { knex } from "../../knex/index.js";
import { EntityNotFound } from "../../EntityNotFound.js";
import { HoldRow } from "../../knex/tables.js";

/**
 * Fetcha  hold by it's unique ID
 * @param id ID of the Hold
 * @returns {HoldRow} requested Hold
 */
export async function getHold(
  id: number
): Promise<HoldRow> {
  const hold = await knex("Holds").first().where({ id });

  if (!hold) throw new EntityNotFound(`Hold #${id} not found`);

  return hold;
}

/**
 * Create a Hold and append it to the table
 * @param creatorID unique ID of the creating user
 * @param userID unique ID of the user affected by the Hold
 * @param description hold description/reason
 * @returns the created hold
 */
export async function createHold(
  creatorID: number,
  userID: number,
  description: string
): Promise<HoldRow> {
  const [holdID] = await knex("Holds").insert(
    {
      creatorID,
      userID,
      description: description,
    },
    "id"
  );

  return getHold(holdID.id);
}

/**
 * Mark a hold as removed
 * @param holdID the ID of the Hold to be removed
 * @param removerID the ID of the user performing the action
 * @returns the updated hold
 */
export async function removeHold(
  holdID: number,
  removerID: number
): Promise<HoldRow> {
  await knex("Holds")
    .update({
      removerID,
      removeDate: knex.fn.now(),
    })
    .where({ id: holdID });

  return getHold(holdID);
}

/**
 * Fetch all Holds under a specified affected user
 * @param userID the ID of the user to filter by
 * @returns the filtered Holds
 */
export async function getHoldsByUser(
  userID: number
): Promise<HoldRow[]> {
  return await knex("Holds").select().where({ userID }).orderBy("createDate", "DESC");
}

/**
 * Determine if a user has an active hold
 * @param userID the ID of the user to check for active holds
 * @returns true if an active hold is present
 */
export async function hasActiveHolds(
  userID: number
): Promise<boolean> {
  return (await getHoldsByUser(userID)).some((hold: HoldRow) => {
    // User has an active hold if its remove date does not exist or is greater than current time
    return !hold.removeDate || hold.removeDate > new Date();
  });
}
