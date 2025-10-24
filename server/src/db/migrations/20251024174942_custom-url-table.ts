import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const customUrlExists = await knex.schema.hasTable("CustomUrls");
    if(customUrlExists){
        return;
    }

    await knex.schema.createTable("CustomUrls", (t) => {
        t.increments("id").primary();
        t.string("shortUrl")
        t.string("longUrl")
    })
}


export async function down(knex: Knex): Promise<void> {
}

