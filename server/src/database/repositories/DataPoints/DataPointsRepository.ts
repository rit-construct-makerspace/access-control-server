/**
 * DataPointsRepository.ts
 * 
 * DB Operations for DataPoints table
 */


import { knex } from "../../knex/index.js";
import { DataPointsRow } from "../../knex/tables.js";



export async function getDataPointByID(id: number): Promise<DataPointsRow | undefined> {
    return await knex("DataPoints").select().where({ id }).first();
}

export async function setDataPointValue(id: number, value: number): Promise<number> {
    return await knex("DataPoints").update({ value }).where({ id });
}

export async function incrementDataPointValue(id: number, increment: number): Promise<number> {
    const data = await getDataPointByID(id);
    if (!data) return -1;
    return await knex("DataPoints").update({ value: (Number(data.value) + Number(increment)) }).where({ id });
}