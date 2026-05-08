/**
 * TermsRepository
 * DB Operations for the Terms and Conditions text value in the TextFields table
 */

import { knex } from "../../knex/index.js";
import { TextFieldRow } from "../../knex/tables.js";



export async function getTerms(): Promise<TextFieldRow | undefined> {
    return await knex("TextFields").select().where({ id: 1 }).first();
}

export async function setTerms(value: string): Promise<number> {
    return await knex("TextFields").update({ value }).where({ id: 1 });
}
