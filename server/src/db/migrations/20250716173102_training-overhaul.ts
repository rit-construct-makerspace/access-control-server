import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const tableExists = await knex.schema.hasTable("PassedModules");
    const columnExists = await knex.schema.hasColumn("TrainingModule", "makerspaceID");

    if (!tableExists) {
        await knex.schema.createTable("PassedModules", (t) => {
            t.integer("userID").references("id").inTable("Users").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.integer("moduleID").references("id").inTable("TrainingModule").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.primary(["userID", "moduleID"]);
            t.timestamp("passedDate").notNullable().defaultTo(knex.fn.now());
        });

        await knex.raw("INSERT INTO \"PassedModules\" SELECT \"makerID\", \"moduleID\", \"submissionDate\" FROM \"ModuleSubmissions\" WHERE passed = TRUE AND \"submissionDate\" >= NOW() - INTERVAL '1 year' ON CONFLICT (\"userID\", \"moduleID\") DO NOTHING;");
    }
    
    if (!columnExists) {
        await knex.schema.alterTable("TrainingModule", (t) => {
            t.integer("makerspaceID").references("id").inTable("Zones").nullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
        })
    }
}


export async function down(knex: Knex): Promise<void> {
    const tableExists = await knex.schema.hasTable("PassedModules");
    const columnExists = await knex.schema.hasColumn("TrainingModule", "makerspaceID");

    if (tableExists) {
        await knex.schema.dropTable("PassedModules");
    }

    if (columnExists) {
        await knex.schema.alterTable("TrainingModule", (t) => {
            t.dropColumn("makerspaceID");
        })
    }
}

