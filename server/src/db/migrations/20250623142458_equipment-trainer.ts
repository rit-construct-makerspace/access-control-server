import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasColumn("Equipment", "requiresTrainerApproval");
    if (exists) return;
    return knex.schema.alterTable("Equipment", (t) => {
        t.boolean("requiresTrainerApproval").notNullable().defaultTo(false);
    })
}


export async function down(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasColumn("Equipment", "requiresTrainerApproval");
    if (!exists) return;
    return knex.schema.alterTable("Equipemnt", (t) => {
        t.dropColumn("requiresTrainerApproval");
    })
}

