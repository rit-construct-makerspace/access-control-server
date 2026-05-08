import { Knex } from "knex";


export async function up(knex: Knex): Promise<void[]> {
    /* Default to archived for these objects until lab managers publish them */

    // Equipment
    const alterEquipment = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("Equipment").then(async function (exists) {
            if (exists) {
                await knex.schema.raw('ALTER TABLE "Equipment" ALTER COLUMN archived SET DEFAULT true');
            }
            else {
                reject();
            }
        })
        resolve();
    });

    // Training modules
    const alterTrainingModules = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("TrainingModule").then(async function (exists) {
            if (exists) {
                await knex.schema.raw('ALTER TABLE "TrainingModule" ALTER COLUMN archived SET DEFAULT true');
            }
            else {
                reject();
            }
        })
        resolve();
    });

    return Promise.all<void>([
        alterEquipment,
        alterTrainingModules
    ]);
}


export async function down(knex: Knex): Promise<void[]> {
    /* Revert */

    // Equipment
    const alterEquipment = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("Equipment").then(async function (exists) {
            if (exists) {
                await knex.schema.raw('ALTER TABLE "Equipment" ALTER COLUMN archived SET DEFAULT false');
            }
            else {
                reject();
            }
        })
        resolve();
    });

    // Training modules
    const alterTrainingModules = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("TrainingModule").then(async function (exists) {
            if (exists) {
                await knex.schema.raw('ALTER TABLE "TrainingModule" ALTER COLUMN archived SET DEFAULT false');
            }
            else {
                reject();
            }
        })
        resolve();
    });

    return Promise.all<void>([
        alterEquipment,
        alterTrainingModules
    ]);
}

