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

/**
 * 
 * @param searchText optional parmeter to filter the entries by
 * @param limit The number of entries ot limit the return to (defaults to 100)
 * @returns up to {@link limit} entries that match the {@link searchText}
 */
export async function getCurrencyLedgerEntriesLimit(searchText?: string, limit = 100): Promise<CurrencyLedgerRow[]> {
    if (!searchText || searchText === "") {
        return await knex("CurrencyLedger").select("*").orderBy("dateTime", "desc").limit(limit);
    }

    if (Number.isNaN(Number(searchText))) {
        // searchText can't be compared to the number fields
        return await knex("CurrencyLedger").select("*").orderBy("dateTime", "desc")
            .whereILike("description", `%${searchText}%`)
            .orWhereILike("source", `%${searchText}%`)
            .limit(limit);
    }

    return await knex("CurrencyLedger").select("*").orderBy("dateTime", "desc")
        .where("id", searchText)
        .orWhere("accountID", searchText)
        .orWhere("amount", searchText)
        .orWhere("atxID", searchText)
        .orWhere("refID", searchText)
        .limit(limit);
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