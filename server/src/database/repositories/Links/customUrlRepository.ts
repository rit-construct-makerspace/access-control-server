import { knex } from "../../knex/index.js";
import { CustomUrlRow } from "../../knex/tables.js";
import { CustomUrlInput } from "../../schemas/customUrlSchema.js";

export async function getCustomUrl(shortUrl: string): Promise<CustomUrlRow> {
  return await knex('CustomUrls').select('*').where({ shortUrl }).first();
}

export async function getCustomUrls() {
  return await knex('CustomUrls').select('*').orderBy("id", "asc");
}

export async function getCustomUrlById(id: number): Promise<CustomUrlRow | undefined> {
  return await knex('CustomUrls').select('*').where({ id }).first();
}

export async function createCustomUrl(shortUrl: string, longUrl: string): Promise<CustomUrlRow> {
  const customUrlRow = (await knex('CustomUrls').insert({ shortUrl, longUrl }).returning('*'))[0];
  return customUrlRow
}

export async function updateCustomUrl(id: number, customUrl: CustomUrlInput): Promise<CustomUrlRow | undefined> {
  await knex('CustomUrls').where('id', id).update({ shortUrl: customUrl.shortUrl, longUrl: customUrl.longUrl });
  return getCustomUrlById(id);
}

export async function deleteCustomUrl(id: number) {
  return await knex('CustomUrls').delete().where({ id });
}