import { GraphQLError } from "graphql";
import { knex } from "../../db/index.js";
import { CurrencyAccountsRow } from "../../db/tables.js";

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

export async function setAccountBalanceCents(id: number, balance: number): Promise<number> {
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