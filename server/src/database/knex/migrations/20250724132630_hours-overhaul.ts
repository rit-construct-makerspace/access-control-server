import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const specialExists = await knex.schema.hasTable("SpecialHours");
    const defaultExists = await knex.schema.hasTable("DefaultHours");
    if (!specialExists) {
        await knex.schema.createTable("SpecialHours", (t) => {
            t.date("day").notNullable();
            t.integer("makerspaceID").references("id").inTable("Zones").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.time("open").nullable();
            t.time("close").nullable();
            t.boolean("closed").notNullable().defaultTo(true);
            t.primary(["day", "makerspaceID"]);
        });
    }

    if (!defaultExists) {
        await knex.schema.createTable("DefaultHours", (t) => {
            t.integer("dayOfWeek").notNullable()
            t.integer("makerspaceID").references("id").inTable("Zones").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.time("open").nullable();
            t.time("close").nullable();
            t.boolean("closed").notNullable().defaultTo(true);
            t.primary(["dayOfWeek", "makerspaceID"]);
        });
    }

    await knex.raw("INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") SELECT 0, id FROM \"Zones\"")
    await knex.raw("INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") SELECT 1, id FROM \"Zones\"")
    await knex.raw("INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") SELECT 2, id FROM \"Zones\"")
    await knex.raw("INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") SELECT 3, id FROM \"Zones\"")
    await knex.raw("INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") SELECT 4, id FROM \"Zones\"")
    await knex.raw("INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") SELECT 5, id FROM \"Zones\"")
    await knex.raw("INSERT INTO \"DefaultHours\" (\"dayOfWeek\", \"makerspaceID\") SELECT 6, id FROM \"Zones\"")

}


export async function down(knex: Knex): Promise<void> {
    knex.schema.dropTableIfExists("SpecialHours");
    knex.schema.dropTableIfExists("DefaultHours");
}

