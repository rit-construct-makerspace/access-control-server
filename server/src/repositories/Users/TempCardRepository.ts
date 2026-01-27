import { GraphQLError } from "graphql";
import { knex } from "../../db/index.js";
import { TempCardRow, UserRow } from "../../db/tables.js";

export async function IssueCard(userID: number, cardTagID: string): Promise<TempCardRow> {
  return await knex("TemporaryCards").insert({ userID: userID, cardTagID: cardTagID });
}

export async function ReturnCard(cardTagID: string): Promise<TempCardRow[]> {
  return await knex("TemporaryCards").update({ returnedDate: knex.fn.now() }).where("cardTagID", "=", cardTagID).andWhere("returnedDate", "=", null).returning("*");
}

export async function getUserFromTempCardTag(cardTag: string): Promise<UserRow | undefined> {
  const result: UserRow[] = await knex("Users").join("TemporaryCards", "Users.id", "TemporaryCards.userID").select("Users.*")
    .where("TemporaryCards.cardTagID", "=", cardTag).andWhere("returnedDate", "=", null);

  if (result.length === 1) {
    return result[0];
  } else if (result.length === 0) {
    return undefined;
  } else {
    throw new GraphQLError("Found multiple users with the same card outstanding: " + cardTag);
  }
}