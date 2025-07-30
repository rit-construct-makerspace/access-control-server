import * as CurrencyAccountRepo from "../Currency/CurrencyAccountsRepository.js"
import { knex } from "../../db/index.js";
import { GraphQLError } from "graphql";

export async function createOrganization(username: string, displayname?: string): Promise<number> {
  // Create the account for the organization
  const accountID = await CurrencyAccountRepo.createAccount();

  const data = displayname ? { username: username, displayname: displayname } : { username: username }

  try {
    var orgID = await knex("Organizations").insert({ ...data, accountID: accountID }).returning("id");
  } catch (e) {
    CurrencyAccountRepo.deleteAccount(accountID);
    throw e;
  }

  if (orgID.length > 0) {
    return orgID[0].id;
  } else {
    CurrencyAccountRepo.deleteAccount(accountID);
    throw new GraphQLError("Failed to create organization")
  }
}