import {Knex} from "knex";


exports.seed = function(knex: Knex) {
    const roomSeed = new Promise<void>(async (resolve, reject) => {
      return knex('Rooms').del()
      .then(function () {
        // Inserts seed entries
        return knex('Rooms').insert([
          {id: 1, name: 'Room I', archived: false},
          {id: 2, name: 'Room II', archived: false},
          {id: 3, name: 'Room III', archived: false}
        ]);
      });
    });


    const equipmentSeed = new Promise<void>(async (resolve, reject) => {
      await knex('Equipment').del()
      .then(function () {
        // Inserts seed entries
        return knex('Equipment').insert([
          {id: 1, name: 'CNC Machine', addedAt: new Date("2023-03-05"), inUse: false, roomID: 1, archived: false},
          {id: 2, name: 'Drill Press', addedAt: new Date("2023-03-05"), inUse: false, roomID: 1, archived: false},
          {id: 3, name: 'T-Tech PCB Mill', addedAt: new Date("2023-03-05"), inUse: false, roomID: 1, archived: false}
        ]);
      });
      resolve();
    });


    const trainingModulesSeed = new Promise<void>(async (resolve, reject) => {
      await knex('TrainingModule').del()
      .then(function () {
        // Inserts seed entries
        return knex('TrainingModule').insert([
          {id: 1, name: 'Training: CNC Machine', archived: false},
          {id: 2, name: 'Training: Drill Press', archived: false},
          {id: 3, name: 'Training: T-Tech PCB Mill', archived: false}
        ]);
      });
      resolve();
    });


    const trainingModulesForEquipmentSeed = new Promise<void>(async (resolve, reject) => {
      await knex('ModulesForEquipment').del()
      .then(function () {
        // Inserts seed entries
        return knex('ModulesForEquipment').insert([
          {id: 1, moduleID: 1, equipmentID: 1},
          {id: 2, moduleID: 2, equipmentID: 2},
          {id: 3, moduleID: 3, equipmentID: 3},
        ]);
      });
      resolve();
    });



    const usersSeed = new Promise<void>(async (resolve, reject) => {
        await knex('Users').del()
            .then(function() {
                //insert seed users
                return knex('Users').insert([
                    {firstName: 'Heinz', lastName: 'Doofenshmirtz',
                        expectedGraduation: "Spring 2025", college: 'GCCIS', pronouns: "he/him", ritUsername: 'dhd5555'}
                ])
            })
    });


    return roomSeed
      .then(() => equipmentSeed)
      .then(() => trainingModulesSeed)
      .then(() => trainingModulesForEquipmentSeed)
        .then(() => usersSeed);
  };