import { GraphQLError } from "graphql";
import { knex } from "../../db/index.js";
import { CurrencyAccountsRow } from "../../db/tables.js";
import * as OrgRepo from "../Users/OrganizationRepository.js";
import * as UserRepo from "../Users/UserRepository.js";
import * as CurrencyLedgerRepo from "./CurrencyLedgerRepository.js";

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
    await knex("CurrencyAccounts").where({ id: accountID }).delete();
    return true;
}

/**
 * This function adjusts an account by {@link amount}, and sets the balance to 0 if the amount is greater than the balance.
 * @param accountID the account to adjust the balance of
 * @param amount the amount to adjust the account by, + to add credits, - to subtract credits
 * @returns true if successful
 * @throws an error if the account isn't found
 */
export async function adjustAccountBalanceCents(accountID: number, amount: number, source: string, description?: string): Promise<boolean> {
    const balance = await getAccountBalanceCents(accountID);

    const new_balance = amount + balance < 0 ? 0 : balance + amount;

    await setAccountBalanceCents(accountID, new_balance);

    await CurrencyLedgerRepo.createCurrencyLedgerEntry(accountID, amount, source, description);

    return true;
}

/**
 * This function attempts to adjust an account by {@link amount}, and returns false if the amount is greater than the account balance
 * @param accountID The account to adjust the balance of
 * @param amount The amount to adjust the account by, + to add credits, - to subtract credits
 * @returns true if successful, false if the amount is greater than the account balance
 * @throws an error if the account can't be found
 */
export async function adjustAccountBalanceIfAvailableCents(accountID: number, amount: number, source: string, description?: string): Promise<boolean> {
    const balance = await getAccountBalanceCents(accountID);

    if (amount + balance < 0) {
        return false;
    }

    const new_balance = balance + amount;

    await setAccountBalanceCents(accountID, new_balance);

    await CurrencyLedgerRepo.createCurrencyLedgerEntry(accountID, amount, source, description);

    return true;
}

/**
 * This function charges an account by {@link amount}, then returns the remaining amount it was unable to charge.
 * Ex: For an account with only 200, if you charge it 500 using this function, it will return 300.
 * @param accountID the account to charge
 * @param amount the amount to charge (must be >= 0)
 * @returns the amount remaining that was not able to be charged
 * @throws an error if the account isn't found, or if the {@link amount} is < 0
 */
export async function chargeAccountReturnRemainingCents(accountID: number, amount: number, source: string, description?: string): Promise<number> {
    if (amount < 0) {
        throw new GraphQLError("Cannot charge a negative amount");
    }

    const balance = await getAccountBalanceCents(accountID);

    if (amount > balance) {
        await setAccountBalanceCents(accountID, 0);
        const left = amount - balance;
        await CurrencyLedgerRepo.createCurrencyLedgerEntry(accountID, -balance, source, description);
        return left;
    }

    await setAccountBalanceCents(accountID, balance - amount);

    await CurrencyLedgerRepo.createCurrencyLedgerEntry(accountID, -amount, source, description);

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