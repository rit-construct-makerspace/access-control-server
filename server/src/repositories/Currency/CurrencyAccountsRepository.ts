import { GraphQLError } from "graphql";
import { knex } from "../../db/index.js";
import { CurrencyAccountsRow, OrganizationsRow } from "../../db/tables.js";
import * as OrgRepo from "../Users/OrganizationRepository.js";
import * as UserRepo from "../Users/UserRepository.js";
import * as CurrencyLedgerRepo from "./CurrencyLedgerRepository.js";

type AccountOwner = {
  displayName: string;
  username: string;
  userID: number | null;
  orgID: number | null;
}

export async function getAccountBalanceCents(id: number): Promise<number> {
  const result = await knex("CurrencyAccounts").where({ id: id }).select("balance");
  if (result.length > 0) {
    return result[0].balance;
  } else {
    throw new GraphQLError(`Account with ID: ${id} not found`);
  }
}

export async function getAccountBalanceDollars(id: number): Promise<number> {
  const result = await knex("CurrencyAccounts").where({ id: id }).select("balance");
  if (result.length > 0) {
    return result[0].balance / 100;
  } else {
    throw new GraphQLError(`Account with ID: ${id} not found`);
  }
}

async function setAccountBalanceCents(id: number, balance: number): Promise<number> {
  const result = await knex("CurrencyAccounts").where({ id: id }).update({ balance: balance }).returning("id");
  if (result.length > 0) {
    return result[0].id;
  } else {
    throw new GraphQLError(`Account with ID: ${id} not found`);
  }
}

export async function getAccountByID(id: number): Promise<CurrencyAccountsRow> {
  const result = await knex("CurrencyAccounts").where({ id: id }).select("*");
  if (result.length > 0) {
    return result[0];
  } else {
    throw new GraphQLError(`Could not find account with ID: ${id}`);
  }
}

export async function createAccount(): Promise<number> {
  const id = await knex("CurrencyAccounts").insert({}).returning("id");
  if (id.length > 0) {
    return id[0].id;
  } else {
    throw new GraphQLError("Failed to create new CurrencyAccount");
  }
}

export async function deleteAccount(accountID: number): Promise<boolean> {
  const result = await knex("CurrencyAccounts").where({ id: accountID, balance: 0 }).delete();
  if (result > 0) {
    return true;
  } else {
    return false;
  }
}

/**
 * This function adjusts an account by {@link amount}, and sets the balance to 0 if the amount is greater than the balance.
 * @param accountID the account to adjust the balance of
 * @param amount the amount to adjust the account by, + to add credits, - to subtract credits
 * @param source the source of the transaction to record in the ledger
 * @param description the description of the transaction to record in the ledger
 * @param createLedgerEntry specifies if this call should create a ledger entry. IF FALSE, IT IS THE CALLERS RESPONSIBILITY TO CORRECTLY LOG THE TRANSACTION TO THE LEDGER
 * @returns true if successful
 * @throws an error if the account isn't found
 */
export async function adjustAccountBalanceCents(accountID: number, amount: number, source: string, description?: string, createLedgerEntry: boolean = true): Promise<boolean> {
  const balance = await getAccountBalanceCents(accountID);

  const new_balance = amount + balance < 0 ? 0 : balance + amount;

  if (balance === new_balance) {
    return true;
  }

  await setAccountBalanceCents(accountID, new_balance);

  await CurrencyLedgerRepo.createCurrencyLedgerEntry(accountID, new_balance - balance, 0, source, description);

  return true;
}

/**
 * This function attempts to adjust an account by {@link amount}, and returns false if the amount is greater than the account balance
 * @param accountID The account to adjust the balance of
 * @param amount The amount to adjust the account by, + to add credits, - to subtract credits
 * @param source the source of the transaction to record in the ledger
 * @param description the description of the transaction to record in the ledger
 * @param createLedgerEntry specifies if this call should create a ledger entry. IF FALSE, IT IS THE CALLERS RESPONSIBILITY TO CORRECTLY LOG THE TRANSACTION TO THE LEDGER
 * @returns true if successful, false if the amount is greater than the account balance
 * @throws an error if the account can't be found
 */
export async function adjustAccountBalanceIfAvailableCents(accountID: number, amount: number, source: string, description?: string, createLedgerEntry: boolean = true): Promise<boolean> {
  const balance = await getAccountBalanceCents(accountID);

  if (amount + balance < 0) {
    return false;
  }

  const new_balance = balance + amount;

  if (new_balance === balance) {
    return true;
  }

  await setAccountBalanceCents(accountID, new_balance);

  if (createLedgerEntry) {
    await CurrencyLedgerRepo.createCurrencyLedgerEntry(accountID, amount, 0, source, description);
  }

  return true;
}

/**
 * This function charges an account by {@link amount}, then returns the remaining amount it was unable to charge.
 * Ex: For an account with only 200, if you charge it 500 using this function, it will return 300.
 * @param accountID the account to charge
 * @param amount the amount to charge (must be >= 0)
 * @param source the source of the transaction to record in the ledger
 * @param description the description of the transaction to record in the ledger
 * @param createLedgerEntry specifies if this call should create a ledger entry. IF FALSE, IT IS THE CALLERS RESPONSIBILITY TO CORRECTLY LOG THE TRANSACTION TO THE LEDGER
 * @returns the amount remaining that was not able to be charged
 * @throws an error if the account isn't found, or if the {@link amount} is < 0
 */
export async function chargeAccountReturnRemainingCents(accountID: number, amount: number, source: string, description?: string, createLedgerEntry: boolean = true): Promise<number> {
  if (amount < 0) {
    throw new GraphQLError("Cannot charge a negative amount");
  }

  const balance = await getAccountBalanceCents(accountID);

  if (amount > balance) {
    await setAccountBalanceCents(accountID, 0);
    const left = amount - balance;
    await CurrencyLedgerRepo.createCurrencyLedgerEntry(accountID, -balance, 0, source, description);
    return left;
  }

  await setAccountBalanceCents(accountID, balance - amount);

  if (createLedgerEntry) {
    await CurrencyLedgerRepo.createCurrencyLedgerEntry(accountID, -amount, 0, source, description);
  }

  return 0;
}

export async function getAccountIDByUsername(username: string): Promise<number | undefined> {
  const org = await OrgRepo.getOrganizationByUsername(username);
  if (org) {
    return org.accountID;
  }

  const user = await UserRepo.getUserByRitUsername(username);
  if (user) {
    return user.accountID;
  }

  return undefined;
}

export async function getAccountOwner(accountID: number): Promise<AccountOwner | undefined> {
  // Check for organization first
  const org = await OrgRepo.getOrganizationByAccountID(accountID);
  if (org) {
    return {
      displayName: org.displayname,
      username: org.username,
      userID: null,
      orgID: org.id
    }
  }

  // Check for user
  const user = await UserRepo.getUserByAccountID(accountID);
  if (user) {
    return {
      displayName: `${user.firstName} ${user.lastName}`,
      username: user.ritUsername,
      userID: user.id,
      orgID: null
    }
  }

  return undefined;
}

/**
 * 
 * @param searchText The query to filter the accounts by, can be undefined
 * @param limit The number of accounts to limit the search to (defaults to 25)
 * @returns Up to {@link limit} accounts that match the {@link searchText}
 */
export async function getAccountsLimit(searchText?: string, limit = 25): Promise<CurrencyAccountsRow[]> {
  if (!searchText || searchText === "") {
    return (await knex("CurrencyAccounts").select("*").limit(limit).orderBy("id", "asc"));
  }

  const res = await knex("CurrencyAccounts")
    .leftOuterJoin("Users", "Users.accountID", "CurrencyAccounts.id")
    .leftOuterJoin("Organizations", "Organizations.accountID", "CurrencyAccounts.id")
    .whereILike("Users.ritUsername", `%${searchText}%`)
    .orWhere("Users.accountID", Number.isNaN(Number(searchText)) ? -1 : searchText)
    .orWhere("Organizations.accountID", Number.isNaN(Number(searchText)) ? -1 : searchText)
    .orWhereILike("Organizations.displayname", `%${searchText}%`)
    .orWhereILike("Organizations.username", `%${searchText}%`)
    .orWhereILike("Users.firstName", `%${searchText}%`)
    .orWhereILike("Users.lastName", `%${searchText}%`)
    .select("CurrencyAccounts.*").limit(limit).orderBy("id", "asc");

  return res;
}