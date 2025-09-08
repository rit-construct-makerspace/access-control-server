import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("Rooms", (t)=>{
        t.renameColumn("zoneID", "makerspaceID");
    });
    await knex.schema.renameTable("Zones", "Makerspaces");
    await knex.schema.alterTable("Makerspaces", (t)=>{
        t.string("subtitle");
        t.string("location");
    })

}


export async function down(knex: Knex): Promise<void> {
}

