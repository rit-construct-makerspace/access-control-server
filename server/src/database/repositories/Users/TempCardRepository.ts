import { GraphQLError } from "graphql";
import { knex } from "../../knex/index.js";
import { TempCardRow, UserRow } from "../../knex/tables.js";

export async function IssueCard(userID: number, cardTagID: string): Promise<TempCardRow> {
  return await knex("TemporaryCards").insert({ userID: userID, cardTagID: cardTagID });
}

export async function ReturnCard(cardTagID: string): Promise<TempCardRow[]> {
  return await knex("TemporaryCards").update({ returnedDate: knex.fn.now() }).where("cardTagID", "=", cardTagID).whereNull("returnedDate").returning("*");
}

export async function getUserFromTempCardTag(cardTag: string): Promise<UserRow | undefined> {
  const result: UserRow[] = await knex("TemporaryCards").join("Users", "TemporaryCards.userID", "Users.id").select("Users.*")
    .where("TemporaryCards.cardTagID", "=", cardTag).whereNull("returnedDate");

  if (result.length === 1) {
    return result[0];
  } else if (result.length === 0) {
    return undefined;
  } else {
    throw new GraphQLError("Found multiple users with the same card outstanding: " + cardTag);
  }
}

export async function getActiveUserCards(userID: number): Promise<TempCardRow[]> {
  return await knex("TemporaryCards").select("*").where("userID", "=", userID).whereNull("returnedDate");
}