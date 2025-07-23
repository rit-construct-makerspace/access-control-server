import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const RoomTrainindTableExists = await knex.schema.hasTable("ModulesForRooms");
    if (!RoomTrainindTableExists) {
        knex.schema.createTable("ModulesForRooms", (t) => {
            t.integer("roomID").references("id").inTable("Rooms").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.integer("moduleID").references("id").inTable("TrainingModule").notNullable()
                .onUpdate("CASCADE")
                .onDelete("CASCADE");
            t.primary(["roomID", "moduleID"]);
        });
    }

    const MakerspaceTrainingTableExists = await knex.schema.hasTable("ModulesForRooms");
    if (!MakerspaceTrainingTableExists) {
        knex.schema.createTable("ModulesForMakerspaces", (t) => {
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
    knex.schema.dropTableIfExists("ModulesForRooms");
    knex.schema.dropTableIfExists("ModulesForMakerspaces");
}

