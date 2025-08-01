import { GraphQLError } from "graphql";
import { knex } from "../../db/index.js";
import { CurrencyLedgerRow } from "../../db/tables.js";

export async function createCurrencyLedgerEntry(
    accountID: number,
    amount: number,
    source: string,
    description?: string,
    atxID?: number,
    refID?: number
): Promise<number> {
    const data = {
        accountID: accountID,
        amount: amount,
        source: source,
        description: description,
        atxID: atxID,
        refID: refID,
    };

    // Remove undefined values to allow DB default values
    const entryObject = Object.entries(data).filter(
        ([key, value]) => value !== undefined
    ).reduce(
        (obj, [key, value]) => {
            // @ts-ignore
            obj[key] = value;
            return obj;
        }, {}
    );

    const result = await knex("CurrencyLedger").insert(entryObject).returning("id");

    if (result.length > 0) {
        return result[0].id;
    } else {
        throw new GraphQLError("Failed to insert entry into the CurrencyLedger");
    }
}

export async function getCurrencyLedgerEntries(): Promise<CurrencyLedgerRow[]> {
    const result = await knex("CurrencyLedger").select("*").orderBy("dateTime", "asc");
    return result;
}

export async function getCurrencyLedgerEntriesLimit(searchText?: string): Promise<CurrencyLedgerRow[]> {
    if (!searchText || searchText === "") {
        return await knex("CurrencyLedger").select("*").orderBy("dateTime", "asc").limit(100);
    }

    if (Number.isNaN(Number(searchText))) {
        // searchText can be compared to the number fields
        return await knex("CurrencyLedger").select("*").orderBy("dateTime", "asc")
            .whereILike("description", `%${searchText}%`)
            .orWhereILike("source", `%${searchText}%`)
            .limit(100);
    }

    return await knex("CurrencyLedger").select("*").orderBy("dateTime", "asc")
        .where("id", searchText)
        .orWhere("accountID", searchText)
        .orWhere("amount", searchText)
        .orWhere("atxID", searchText)
        .orWhere("refID", searchText)
        .limit(100);
}

export async function getCurrencyLedgerEntry(id: number): Promise<CurrencyLedgerRow> {
    const result = await knex("CurrencyLedger").where({ id: id }).select("*");
    if (result.length > 0) {
        return result[0];
    } else {
        throw new GraphQLError(`Failed to find CurrencyLedger entry with ID: ${id}`);
    }
}

export async function getNextRefID(): Promise<number> {
    const result = await knex.raw("UPDATE \"RefIDCounter\" SET \"refID\" = CASE WHEN \"refID\" = 2147483647 THEN 1 ELSE \"refID\" + 1 END RETURNING \"refID\"");
    return result.rows[0].refID;
}