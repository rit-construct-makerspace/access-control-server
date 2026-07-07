import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasColumn("Zones", "imageUrl");
    if (exists) return;
    return knex.schema.alterTable("Zones", (t) => {
        t.string("imageUrl").nullable();
    })
}


export async function down(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasColumn("Zones", "imageUrl");
    if (!exists) return;
    return knex.schema.alterTable("Zones", (t) => {
        t.dropColumn("imageUrl")
    })
}

