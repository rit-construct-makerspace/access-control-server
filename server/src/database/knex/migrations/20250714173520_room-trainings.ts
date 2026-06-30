import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const RoomTrainindTableExists = await knex.schema.hasTable("ModulesForRooms");
    if (!RoomTrainindTableExists) {
        await knex.schema.createTable("ModulesForRooms", (t) => {
            t.integer("roomID").references("id").inTable("Rooms").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.integer("moduleID").references("id").inTable("TrainingModule").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.primary(["roomID", "moduleID"]);
        });
    }

    const MakerspaceTrainingTableExists = await knex.schema.hasTable("ModulesForMakerspaces");
    if (!MakerspaceTrainingTableExists) {
        await knex.schema.createTable("ModulesForMakerspaces", (t) => {
            t.integer("makerspaceID").references("id").inTable("Zones").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.integer("moduleID").references("id").inTable("TrainingModule").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.primary(["makerspaceID", "moduleID"]);
        });
    }
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("ModulesForRooms");
    await knex.schema.dropTableIfExists("ModulesForMakerspaces");
}

