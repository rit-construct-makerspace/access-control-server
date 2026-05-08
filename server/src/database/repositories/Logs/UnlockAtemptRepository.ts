import { knex } from "../../knex/index.js";
import { UnlockAttemptLogRow } from "../../knex/tables.js";

export async function createUnlockAttemptLog(
  equipmentID: number | undefined,
  equipmentName: string,
  userID: number | undefined,
  username: string,
  success: boolean,
  reason: string
): Promise<UnlockAttemptLogRow> {
  const result = await knex("UnlockAttemptLogs").insert({
    equipmentID: equipmentID,
    equipmentName: equipmentName,
    userID: userID,
    username: username,
    success: success,
    reason: reason
  }).returning("*");

  return result[0];
}