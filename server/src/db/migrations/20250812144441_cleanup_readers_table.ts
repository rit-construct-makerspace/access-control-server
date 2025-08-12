import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    if (! await knex.schema.hasColumn("Readers", "machineType")) {
        return;
    }

    await knex.schema.alterTable("Readers", (t)=>{
        t.dropColumns("machineType", "machineID", "zone", "helpRequested");
        // t.("SN");
        t.dropNullable("SN");
    })
}


export async function down(knex: Knex): Promise<void> {
    if (await knex.schema.hasColumn("Readers", "machineType")) {
        return;
    }

    await knex.schema.alterTable("Readers", (t)=>{
        t.integer("machineID").references("id").inTable("Equipment").nullable();
        t.string("machineType");
        t.string("zone");
        t.boolean("helpRequested").defaultTo(false);
        t.setNullable("SN");
    })
}

