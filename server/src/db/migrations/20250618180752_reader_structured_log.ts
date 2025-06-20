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
        t.bigInteger("currentInstanceID");
        t.jsonb("log");
        t.foreign("readerID").references("id").inTable("Readers");
        // Readers can vary their instance often, so capture who it was at this point
        // more likely to be up to date
        t.foreign("currentInstanceID").references("id").inTable("EquipmentInstances").onDelete("set null");
    })
}


export async function down(knex: Knex): Promise<void> {
    const tableExists = await knex.schema.hasTable("ReaderLogs");
    if (!tableExists) {
        return;
    }
    return knex.schema.dropTable("ReaderLogs");
}

