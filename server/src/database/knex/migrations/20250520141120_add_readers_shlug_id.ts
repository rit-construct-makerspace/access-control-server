import type { Knex } from "knex";

const columnName = "shlugID";
export async function up(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasColumn("Readers", columnName);
    if (exists) return;
    return knex.schema.alterTable("Readers", (t) => {
        t.string(columnName).nullable().unique();
    })

}


export async function down(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasColumn("Readers", columnName);
    if (!exists) return;
    return knex.schema.alterTable("Readers", (t) => {
        t.dropColumn(columnName);
    })
}

