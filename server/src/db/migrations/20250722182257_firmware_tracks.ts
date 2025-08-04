import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasColumn("Readers", "targetFirmwareVersion");
    if (exists) {
        return;
    }
    await knex.schema.alterTable("Readers", (t) => {
        t.string("targetFirmwareVersion").nullable()
    });
}


export async function down(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasColumn("Readers", "targetFirmwareVersion");
    if (!exists) {
        return;
    }

    await knex.schema.alterTable("Readers", (t) => {
        t.dropColumn("targetFirmwareVersion");
    });
}

