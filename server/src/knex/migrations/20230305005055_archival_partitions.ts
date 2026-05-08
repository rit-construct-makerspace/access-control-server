import { Knex } from "knex";


export async function up(knex: Knex): Promise<void[]> {
    /* Creates indexes on archived records for performance */

    // Users
    const alterUsers = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("Users").then(async function (exists) {
            if (exists) {
                await knex.schema.alterTable("Users", function (t) {
                    t.index("id", "Users_active_idx", {
                        predicate: knex.whereRaw("archived = FALSE")
                    });
                })
            }
            else {
                reject();
            }
        })
        resolve();
    });

    // Equipment
    const alterEquipment = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("Equipment").then(async function (exists) {
            if (exists) {
                await knex.schema.alterTable("Equipment", function (t) {
                    t.index("id", "Equipment_active_idx", {
                        predicate: knex.whereRaw("archived = FALSE")
                    });
                })
            }
            else {
                reject();
            }
        })
        resolve();
    });

    // Rooms
    const alterRooms = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("Rooms").then(async function (exists) {
            if (exists) {
                await knex.schema.alterTable("Rooms", function (t) {
                    t.index("id", "Rooms_active_idx", {
                        predicate: knex.whereRaw("archived = FALSE")
                    });
                })
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
                await knex.schema.alterTable("TrainingModule", function (t) {
                    t.index("id", "TrainingModules_active_idx", {
                        predicate: knex.whereRaw("archived = FALSE")
                    });
                })
            }
            else {
                reject();
            }
        })
        resolve();
    });

    // Inventory items
    const alterInventoryItems = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("InventoryItem").then(async function (exists) {
            if (exists) {
                await knex.schema.alterTable("InventoryItem", function (t) {
                    t.index("id", "InventoryItem_active_idx", {
                        predicate: knex.whereRaw("archived = FALSE")
                    });
                })
            }
            else {
                reject();
            }
        })
        resolve();
    });

    // Labels
    const alterLabels = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("Label").then(async function (exists) {
            if (exists) {
                await knex.schema.alterTable("Label", function (t) {
                    t.index("id", "Label_active_idx", {
                        predicate: knex.whereRaw("archived = FALSE")
                    });
                })
            }
            else {
                reject();
            }
        })
        resolve();
    });

    return Promise.all<void>([
        alterUsers,
        alterEquipment,
        alterRooms,
        alterTrainingModules,
        alterInventoryItems,
        alterLabels
    ]);
}


export async function down(knex: Knex): Promise<void[]> {
    // Users
    const alterUsers = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("Users").then(async function (exists) {
            if (exists) {
                await knex.schema.alterTable("Users", function (t) {
                    t.dropIndex("id", "Users_active_idx");
                })
            }
            else {
                reject();
            }
        })
        resolve();
    });

    // Equipment
    const alterEquipment = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("Equipment").then(async function (exists) {
            if (exists) {
                await knex.schema.alterTable("Equipment", function (t) {
                    t.dropIndex("id", "Equipment_active_idx");
                })
            }
            else {
                reject();
            }
        })
        resolve();
    });

    // Rooms
    const alterRooms = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("Rooms").then(async function (exists) {
            if (exists) {
                await knex.schema.alterTable("Rooms", function (t) {
                    t.dropIndex("id", "Rooms_active_idx");
                })
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
                await knex.schema.alterTable("TrainingModule", function (t) {
                    t.dropIndex("id", "TrainingModules_active_idx");
                })
            }
            else {
                reject();
            }
        })
        resolve();
    });

    // Inventory items
    const alterInventoryItems = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("InventoryItem").then(async function (exists) {
            if (exists) {
                await knex.schema.alterTable("InventoryItem", function (t) {
                    t.dropIndex("id", "InventoryItem_active_idx");
                })
            }
            else {
                reject();
            }
        })
        resolve();
    });

    // Labels
    const alterLabels = new Promise<void>(async (resolve, reject) => {
        await knex.schema.hasTable("Label").then(async function (exists) {
            if (exists) {
                await knex.schema.alterTable("Label", function (t) {
                    t.dropIndex("id", "Label_active_idx");
                })
            }
            else {
                reject();
            }
        })
        resolve();
    });

    return Promise.all<void>([
        alterUsers,
        alterEquipment,
        alterRooms,
        alterTrainingModules,
        alterInventoryItems,
        alterLabels
    ]);
}

