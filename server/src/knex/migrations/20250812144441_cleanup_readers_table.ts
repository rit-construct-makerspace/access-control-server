import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    if (! await knex.schema.hasColumn("Readers", "machineType")) {
        return;
    }

    await knex.schema.alterTable("Readers", async (t) => {
        t.dropColumns("machineType", "machineID", "zone", "helpRequested");
        if (await knex.schema.hasColumn("Readers", "SN")) {
            t.dropNullable("SN");
        } else {
            t.string("SN").notNullable();
        }
    })
}


export async function down(knex: Knex): Promise<void> {
    if (await knex.schema.hasColumn("Readers", "machineType")) {
        return;
    }

    await knex.schema.alterTable("Readers", (t) => {
        t.integer("machineID").references("id").inTable("Equipment").nullable();
        t.string("machineType");
        t.string("zone");
        t.boolean("helpRequested").defaultTo(false);
        t.setNullable("SN");
    })
}

