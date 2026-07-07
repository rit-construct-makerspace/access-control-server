import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const alreadyDone = await knex.schema.hasColumn("Equipment", "needsWelcome");
    if (alreadyDone) {
        return;
    }

    return knex.schema.alterTable("Equipment", (t) => {
        t.boolean("needsWelcome").notNullable().defaultTo(false);
    }).alterTable("EquipmentInstances", (t) => {
        t.bigInteger('readerID');
        t.foreign("readerID").references("id").inTable("Readers").onDelete('set null');
    }).alterTable("Readers", (t) => {
        t.integer("readerKeyCycle").notNullable().defaultTo(0);
    })

}


export async function down(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasColumn("Equipment", "needsWelcome");
    if (!exists) {
        return;
    }
    return knex.schema.alterTable("Equipment", (t) => {
        t.dropColumn("needsWelcome");
    }).alterTable("EquipmentInstances", (t) => {
        t.dropColumn("readerID")
    }).alterTable("Readers", (t) => {
        t.dropColumns("readerKeyCycle");
    })

}