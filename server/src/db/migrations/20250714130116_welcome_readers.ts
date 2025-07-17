import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const tableThere = await knex.schema.hasTable("MakerspaceWelcomeReaders");
    if (tableThere) {
        return;
    }

    await knex.schema.alterTable("Readers", (t)=>{
        t.string("targetFirmwareVersion").nullable()
    })
    await knex.schema.createTable("MakerspaceWelcomeReaders", (t) => {
        t.bigInteger("makerspaceID").notNullable();
        t.foreign("makerspaceID").references("id").inTable("Zones");
        t.bigInteger("readerID").notNullable();
        t.foreign("readerID").references("id").inTable("Readers");

        t.primary(["makerspaceID", "readerID"])
    });
}


export async function down(knex: Knex): Promise<void> {
    const tableThere = await knex.schema.hasTable("MakerspaceWelcomeReaders");
    if (!tableThere) {
        return;
    }
    await knex.schema.alterTable("Readers", (t)=>{
        t.dropColumn("targetFirmwareVersion");
    })

    await knex.schema.dropTable("MakerspaceWelcomeReaders");

}

