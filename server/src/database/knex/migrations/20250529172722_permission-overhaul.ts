import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const adminExists = await knex.schema.hasColumn("Users", "admin");
    if (!adminExists) {
        await knex.schema.alterTable("Users", (t) => {
            t.boolean("admin").notNullable().defaultTo(false);
        })
    }

    const managersExists = await knex.schema.hasTable("Managers");
    if (!managersExists) {
        await knex.schema.createTable("Managers", (t) => {
            t.integer("userID").references("id").inTable("Users").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.integer("makerspaceID").references("id").inTable("Zones").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.primary(["userID", "makerspaceID"]);
        })
    }

    const staffExists = await knex.schema.hasTable("Staff");
    if (!staffExists) {
        await knex.schema.createTable("Staff", (t) => {
            t.integer("userID").references("id").inTable("Users").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.integer("makerspaceID").references("id").inTable("Zones").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.primary(["userID", "makerspaceID"]);
        })
    }
    
    const trainersExist = await knex.schema.hasTable("Trainers");
    if (!trainersExist) {
        await knex.schema.createTable("Trainers", (t) => {
            t.integer("userID").references("id").inTable("Users").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.integer("equipmentID").references("id").inTable("Equipment").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.primary(["userID", "equipmentID"]);
        })
    }

    const restrictionsExist = await knex.schema.hasTable("Restrictions");
    if (!restrictionsExist) {
        await knex.schema.createTable("Restrictions", (t) => {
            t.increments("id").primary();
            t.integer("creatorID").references("id").inTable("Users")
                .onUpdate("CASCADE")
                .onDelete("SET NULL");
            t.integer("userID").references("id").inTable("Users").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.integer("makerspaceID").references("id").inTable("Zones").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.string("reason").nullable();
            t.timestamp("createDate").defaultTo(knex.fn.now());
        })
    }
}


export async function down(knex: Knex): Promise<void> {
    const adminExists = await knex.schema.hasColumn("Users", "admin");
    if (adminExists) {
        await knex.schema.alterTable("Users", (t) => {
            t.dropColumn("admin");
        })
    }

    const managersExists = await knex.schema.hasTable("Managers");
    if (managersExists) {
        await knex.schema.dropTable("Managers");
    }

    const staffExists = await knex.schema.hasTable("Staff");
    if (staffExists) {
        await knex.schema.dropTable("Staff");
    }

    const trainersExist = await knex.schema.hasTable("Trainers");
    if (trainersExist) {
        await knex.schema.dropTable("Trainers");
    }

    const restrictionsExist = await knex.schema.hasTable("Restrictions");
    if (restrictionsExist) {
        await knex.schema.dropTable("Restrictions");
    }
}

