import type { Knex } from "knex";

const columnName = "universityID";
export async function up(knex: Knex): Promise<void> {
    const columnExists: boolean = await knex.schema.hasColumn("Users", columnName);
    if (!columnExists) {
        return;
    }
    return knex.schema.alterTable("Users", (t) =>
        t.dropColumn(columnName)
    );
}

export async function down(knex: Knex): Promise<void> {
    const columnExists: boolean = await knex.schema.hasColumn("Users", columnName);
    if (columnExists) {
        return;
    }
    return knex.schema.alterTable("Users", (t) =>
        t.string(columnName)
    );
}

