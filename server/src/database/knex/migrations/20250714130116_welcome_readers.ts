import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const tableThere = await knex.schema.hasTable("MakerspaceWelcomeReaders");
    if (!tableThere) {
        await knex.schema.createTable("MakerspaceWelcomeReaders", (t) => {
            t.bigInteger("makerspaceID").notNullable();
            t.foreign("makerspaceID").references("id").inTable("Zones");
            t.bigInteger("readerID").notNullable();
            t.foreign("readerID").references("id").inTable("Readers");

            t.primary(["makerspaceID", "readerID"])
        });
        return;
    }

    if (!(await knex.schema.hasColumn("Readers", "targetFirmwareVersion"))) {
        await knex.schema.alterTable("Readers", (t) => {
            t.string("targetFirmwareVersion").nullable()
        })
    }
}


export async function down(knex: Knex): Promise<void> {
    const tableThere = await knex.schema.hasTable("MakerspaceWelcomeReaders");
    if (tableThere) {
        await knex.schema.dropTable("MakerspaceWelcomeReaders");
    }
    if (await knex.schema.hasColumn("Readers", "targetFirmwareVersion")) {
        await knex.schema.alterTable("Readers", (t) => {
            t.dropColumn("targetFirmwareVersion");
        })
    }


}

