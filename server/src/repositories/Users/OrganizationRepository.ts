import * as CurrencyAccountRepo from "../Currency/CurrencyAccountsRepository.js"
import { knex } from "../../db/index.js";
import { GraphQLError } from "graphql";
import { OrganizationsRow } from "../../db/tables.js";

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

export async function getOrganizationByOrgID(id: number): Promise<OrganizationsRow | undefined> {
  return await knex("Organizations").where("id", id).select("*").first();
}

export async function getOrganizationByUsername(username: string): Promise<OrganizationsRow | undefined> {
  return await knex("Organizations").where({ username: username }).select("*").first();
}

export async function getOrganizationByAccountID(accountID: number): Promise<OrganizationsRow | undefined> {
  return await knex("Organizations").where({ accountID: accountID }).select("*").first();
}

export async function searchOrganizationsLimit(searchText?: string, limit = 100): Promise<OrganizationsRow[]> {
  if (!searchText || searchText === "") {
    return await knex("Organizations").select("*").limit(limit);
  }

  return await knex("Organizations").select("*").limit(limit)
    .whereILike("displayname", `%${searchText}%`)
    .orWhereILike("username", `%${searchText}%`);
}

export async function deleteOrganization(orgID: number): Promise<Boolean> {
  const org = await getOrganizationByOrgID(orgID);

  if (!org) {
    return false;
  }

  // Delete account if able
  const success = CurrencyAccountRepo.deleteAccount(org.accountID);

  if (!success) {
    return false;
  }

  await knex("Organizations").where("id", orgID).delete();
  return true;
}