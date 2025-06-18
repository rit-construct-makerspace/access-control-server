import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const tableExists = await knex.schema.hasTable("ReaderLogs");
    if (tableExists) {
        return;
    }
    return knex.schema.createTable("ReaderLogs", (t) => {
        t.bigIncrements().primary();
        t.dateTime("dateTime");
        t.bigInteger("readerID");
        t.jsonb("log");
        t.foreign("readerID").references("id").inTable("Readers");
    })
}


export async function down(knex: Knex): Promise<void> {
    const tableExists = await knex.schema.hasTable("ReaderLogs");
    if (!tableExists) {
        return;
    }
    return knex.schema.dropTable("ReaderLogs");
}

