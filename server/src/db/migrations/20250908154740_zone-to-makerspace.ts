import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    if (await knex.schema.hasTable("Makerspaces")) {
        // already did it
        return;
    }
    await knex.schema.renameTable("Zones", "Makerspaces");

    await knex.schema.alterTable("Rooms", (t) => {
        t.renameColumn("zoneID", "makerspaceID");
    });


    await knex.schema.alterTable("Makerspaces", (t) => {
        t.string("subtitle");
        t.string("location");
    })

}


export async function down(knex: Knex): Promise<void> {
    if (await knex.schema.hasTable("Zones")) {
        // already didnt do it
        return;
    }

    await knex.schema.renameTable("Makerspaces", "Zones");

    await knex.schema.alterTable("Rooms", (t) => {
        t.renameColumn("makerspaceID", "zoneID");
    });
    await knex.schema.alterTable("Makerspaces", (t) => {
        t.dropColumns("subtitle", "location");
    })
}

