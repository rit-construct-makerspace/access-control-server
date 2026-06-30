import type { Knex } from "knex";


const columnName = "pairTime";
export async function up(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasColumn("Readers", columnName);
    if (exists) return;

    return knex.schema.alterTable("Readers", (t) => {
        t.timestamp(columnName);
    })
}


export async function down(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasColumn("Readers", columnName);
    if (!exists) return;
    return knex.schema.alterTable("Readers", (t) => {
        t.dropColumn(columnName);
    })

}

