import { knex } from "../../db/index.js";
import * as EquipmentRepo from "../../repositories/Equipment/EquipmentRepository.js";
import * as RoomRepo from "../../repositories/Rooms/RoomRepository.js";
import * as ModuleRepo from "../../repositories/Training/ModuleRepository.js";
import * as SubmissionRepo from "../../repositories/Training/SubmissionRepository.js";
import * as UserRepo from "../../repositories/Users/UserRepository.js";
import * as Holdsrepo from "../../repositories/Holds/HoldsRepository.js";
import { TrainingModuleItem } from "../../db/tables.js";

const tables = ["ModuleSubmissions", "ModulesForEquipment", "Equipment", "TrainingModule", "Holds", "Rooms", "Users"];

const testRoom = {
  id: 0,
  name: "Test Room"
};

describe("EquipmentRepository tests", () => {
  beforeAll(() => {
    return knex.migrate.latest();
    // we can here also seed our tables, if we have any seeding files
  });

  beforeEach(async () => {
    try {
      // reset tables...
      for(const t of tables) {
        await knex(t).del();
      }
    } catch (error) {
      fail("Failed setup");
    }
  });

  afterAll(async () => {
    try {
      // reset tables...
      for(const t of tables) {
        await knex(t).del();
      }
      await knex.destroy();
    } catch (error) {
      fail("Failed teardown");
    }
  });

  test("getEquipments with no rows", async () => {
    let equipmentRows = await EquipmentRepo.getEquipment();
    expect(equipmentRows.length).toBe(0);
  });

  test("addEquipment and get", async () => {
    // Add a room
    const roomID = (await RoomRepo.addRoom({
        id: 0,
        name: "Test Room",
        zoneID: null
    })).id;

    // Add equipment
    const equipmentData = await EquipmentRepo.addEquipment({
      name: "Test Equipment",
      roomID: roomID,
      moduleIDs: <number[]>[],
      imageUrl: null,
      sopUrl: null,
      notes: null,
      byReservationOnly: false,
      needsWelcome: true
    });

    // Expect one equipment
    let equipmentRows = await EquipmentRepo.getEquipment();
    expect(equipmentRows.length).toBe(1);
    expect(equipmentRows[0]).toEqual(equipmentData);
  });

  test("getEquipmentByID", async () => {
    // Add a room
    const roomID = (await RoomRepo.addRoom({
        id: 0,
        name: "Test Room",
        zoneID: null
    })).id;

    // Add and get ID
    const equipmentID = (await EquipmentRepo.addEquipment({
      name: "Test Equipment",
      roomID: roomID,
      moduleIDs: <number[]>[],
      imageUrl: null,
      sopUrl: null,
      notes: null,
      byReservationOnly: false,
      needsWelcome: true
    })).id;

    // Get by ID
    let equipmentRow = await EquipmentRepo.getEquipmentByID(equipmentID);
    expect(equipmentRow).toBeDefined();
  });

  test("updateEquipment", async () => {
    // Add a room
    const roomID = (await RoomRepo.addRoom({
        id: 0,
        name: "Test Room",
        zoneID: null
    })).id;

    // Add equipment to the room
    const equipmentID = (await EquipmentRepo.addEquipment({
        name: "Test Equipment",
        roomID: roomID,
        moduleIDs: <number[]>[],
        imageUrl: null,
        sopUrl: null,
        notes: null,
        byReservationOnly: false,
        needsWelcome: true
    })).id;

    // Check added
    expect(await EquipmentRepo.getEquipmentByID(equipmentID)).toBeDefined();

    // Update name
    await EquipmentRepo.updateEquipment(equipmentID, {
        name: "Test Equipment Updated",
        roomID: roomID,
        moduleIDs: <number[]>[],
        imageUrl: null,
        sopUrl: null,
        notes: null,
        byReservationOnly: false,
        needsWelcome: true
    });

    // Check name updated
    expect((await EquipmentRepo.getEquipmentByID(equipmentID)).name).toBe("Test Equipment Updated");
  });

  test("archiveEquipment", async () => {
    // Add a room
    const roomID = (await RoomRepo.addRoom({
        id: 0,
        name: "Test Room",
        zoneID: null
    })).id;

    // Add equipment to the room
    const equipmentID = (await EquipmentRepo.addEquipment({
        name: "Test Equipment",
        roomID: roomID,
        moduleIDs: <number[]>[],
        imageUrl: null,
        sopUrl: null,
        notes: null,
        byReservationOnly: false,
        needsWelcome: true
    })).id;

    // Check added
    let targetEquipment = await EquipmentRepo.getEquipmentByID(equipmentID);
    expect(targetEquipment).toBeDefined();

    // Archive
    await EquipmentRepo.setEquipmentArchived(equipmentID, true);

    // Check archived
    expect((await EquipmentRepo.getEquipmentByID(equipmentID)).archived).toBe(true);

    // Not returned as active equipment
    expect((await EquipmentRepo.getEquipmentWhereArchived(false)).map((equipment) => equipment.id)).not.toContainEqual(targetEquipment.id);

    // Is returned as archived equipment
    expect((await EquipmentRepo.getEquipmentWhereArchived(true)).map((equipment) => equipment.id)).toContainEqual(targetEquipment.id);
  });

  test("addModulesToEquipment and get", async () => {
    // Add a room
    const roomID = (await RoomRepo.addRoom({
        id: 0,
        name: "Test Room",
        zoneID: null
    })).id;

    // Add equipment to the room
    const equipmentID = (await EquipmentRepo.addEquipment({
        name: "Test Equipment",
        roomID: roomID,
        moduleIDs: <number[]>[],
        imageUrl: null,
        sopUrl: null,
        notes: null,
        byReservationOnly: false,
        needsWelcome: true
    })).id;

    const exampleQuiz: TrainingModuleItem[] = [{
      id: '6784b67f-10d0-4476-8a81-e30c5f537e4e',
      type: 'TEXT',
      text: 'example'
    }]
    const moduleID = (await ModuleRepo.addModule("Test Module", exampleQuiz)).id;

    // Check added
    expect(await EquipmentRepo.getEquipmentByID(equipmentID)).toBeDefined();

    // Add module to equipment
    await EquipmentRepo.addModulesToEquipment(equipmentID, [moduleID]);

    const modules = await EquipmentRepo.getModulesByEquipment(equipmentID);
    expect(modules.length).toBe(1);
    expect(modules[0].name).toBe("Test Module");
  });

  test("updateModules", async () => {
    const exampleQuiz: TrainingModuleItem[] = [{
      id: '6784b67f-10d0-4476-8a81-e30c5f537e4e',
      type: 'TEXT',
      text: 'example'
    }]
    // Add a room
    const roomID = (await RoomRepo.addRoom({
        id: 0,
        name: "Test Room",
        zoneID: null
    })).id;

    // Add equipment to the room
    const equipmentID = (await EquipmentRepo.addEquipment({
        name: "Test Equipment",
        roomID: roomID,
        moduleIDs: <number[]>[],
        imageUrl: null,
        sopUrl: null,
        notes: null,
        byReservationOnly: false,
        needsWelcome: true
    })).id;

    const moduleOneID = (await ModuleRepo.addModule("Test Module I", exampleQuiz)).id;
    const moduleTwoID = (await ModuleRepo.addModule("Test Module II", exampleQuiz)).id;

    // Check added
    expect(await EquipmentRepo.getEquipmentByID(equipmentID)).toBeDefined();

    // Add module to equipment
    await EquipmentRepo.addModulesToEquipment(equipmentID, [moduleOneID]);

    const modulesPreUpdate = await EquipmentRepo.getModulesByEquipment(equipmentID);
    expect(modulesPreUpdate.length).toBe(1);
    expect(modulesPreUpdate[0].name).toBe("Test Module I");

    // Update to use module II
    await EquipmentRepo.updateModules(equipmentID, [moduleTwoID]);

    const modulesPostUpdate = await EquipmentRepo.getModulesByEquipment(equipmentID);
    expect(modulesPostUpdate.length).toBe(1);
    expect(modulesPostUpdate[0].name).toBe("Test Module II");
  });

  test("hasAcccess no modules", async () => {
    // Add a room
    const roomID = (await RoomRepo.addRoom({
        id: 0,
        name: "Test Room",
        zoneID: null
    })).id;

    // Add equipment to the room
    const equipmentID = (await EquipmentRepo.addEquipment({
        name: "Test Equipment",
        roomID: roomID,
        moduleIDs: <number[]>[],
        imageUrl: null,
        sopUrl: null,
        notes: null,
        byReservationOnly: false,
        needsWelcome: true
    })).id;

    // Create user
    const userID = (await UserRepo.createUser({
      firstName: "John",
      lastName: "Doe",
      ritUsername: "jd0000",
    })).id;

    const uid = "000000000";

    // Update with UID
    const user = await UserRepo.updateStudentProfile({
      userID: userID,
      pronouns: "he/him",
      college: "Test College",
      expectedGraduation: "2050"
    });


  });

  test("hasAcccess bad swipe", async () => {
    // Add a room
    const roomID = (await RoomRepo.addRoom({
        id: 0,
        name: "Test Room",
        zoneID: null
    })).id;

    // Add equipment to the room
    const equipmentID = (await EquipmentRepo.addEquipment({
        name: "Test Equipment",
        roomID: roomID,
        moduleIDs: <number[]>[],
        imageUrl: null,
        sopUrl: null,
        notes: null,
        byReservationOnly: false,
        needsWelcome: true
    })).id;

    // Check added
    expect(await EquipmentRepo.getEquipmentByID(equipmentID)).toBeDefined();

    // Create user
    const userID = (await UserRepo.createUser({
      firstName: "John",
      lastName: "Doe",
      ritUsername: "jd0000",
    })).id

    const uid = "000000000";

    // Update with UID
    const user = await UserRepo.updateStudentProfile({
      userID: userID,
      pronouns: "he/him",
      college: "Test College",
      expectedGraduation: "2050"
    });

    // Place a hold on themselves
    await Holdsrepo.createHold(
      userID,
      userID,
      "Test Hold"
    );

    // Check access for non-existent user
    expect(await EquipmentRepo.hasAccessByID(userID, equipmentID)).toBe(false);
  });

  test("hasAcccess with one module", async () => {
    // Add a room
    const roomID = (await RoomRepo.addRoom({
        id: 0,
        name: "Test Room",
        zoneID: null
    })).id;

    // Add equipment to the room
    const equipmentID = (await EquipmentRepo.addEquipment({
        name: "Test Equipment",
        roomID: roomID,
        moduleIDs: <number[]>[],
        imageUrl: null,
        sopUrl: null,
        notes: null,
        byReservationOnly: false,
        needsWelcome: true,
    })).id;

    // Check added
    expect(await EquipmentRepo.getEquipmentByID(equipmentID)).toBeDefined();

    // Create user
    const userID = (await UserRepo.createUser({
      firstName: "John",
      lastName: "Doe",
      ritUsername: "jd0000",
    })).id;

    const uid = "000000000";

    // Update with UID
    const user = await UserRepo.updateStudentProfile({
      userID: userID,
      pronouns: "he/him",
      college: "Test College",
      expectedGraduation: "2050"
    });

    const exampleQuiz: TrainingModuleItem[] = [{
      id: '6784b67f-10d0-4476-8a81-e30c5f537e4e',
      type: 'TEXT',
      text: 'example'
    }]

    // Create module
    const moduleID = (await ModuleRepo.addModule("Test Module", exampleQuiz)).id;

    // Add module to equipment
    await EquipmentRepo.addModulesToEquipment(equipmentID, [moduleID]);

    // Add passed attempt to user
    await SubmissionRepo.addSubmission(userID, moduleID, true, "");

  });

  test("hasAcccess with hold", async () => {
    // Add a room
    const roomID = (await RoomRepo.addRoom({
        id: 0,
        name: "Test Room",
        zoneID: null
    })).id;

    // Add equipment to the room
    const equipmentID = (await EquipmentRepo.addEquipment({
        name: "Test Equipment",
        roomID: roomID,
        moduleIDs: <number[]>[],
        imageUrl: null,
        sopUrl: null,
        notes: null,
        byReservationOnly: false,
        needsWelcome: true
    })).id;

    // Check added
    expect(await EquipmentRepo.getEquipmentByID(equipmentID)).toBeDefined();

    // Create user
    const userID = (await UserRepo.createUser({
      firstName: "John",
      lastName: "Doe",
      ritUsername: "jd0000",
    })).id;

    const uid = "000000000";

    // Update with UID
    const user = await UserRepo.updateStudentProfile({
      userID: userID,
      pronouns: "he/him",
      college: "Test College",
      expectedGraduation: "2050"
    });

    // Place a hold on themselves
    await Holdsrepo.createHold(
      userID,
      userID,
      "Test Hold"
    );

    expect(await EquipmentRepo.hasAccessByID(userID, equipmentID)).toBe(false);
  });

  test("hasAcccess with insufficient training", async () => {
    // Add a room
    const roomID = (await RoomRepo.addRoom({
        id: 0,
        name: "Test Room",
        zoneID: null
    })).id;

    // Add equipment to the room
    const equipmentID = (await EquipmentRepo.addEquipment({
        name: "Test Equipment",
        roomID: roomID,
        moduleIDs: <number[]>[],
        imageUrl: null,
        sopUrl: null,
        notes: null,
        byReservationOnly: false,
        needsWelcome: true,
    })).id;

    // Check added
    expect(await EquipmentRepo.getEquipmentByID(equipmentID)).toBeDefined();

    // Create user
    const userID = (await UserRepo.createUser({
      firstName: "John",
      lastName: "Doe",
      ritUsername: "jd0000",
    })).id;

    const uid = "000000000";

    // Update with UID
    const user = await UserRepo.updateStudentProfile({
      userID: userID,
      pronouns: "he/him",
      college: "Test College",
      expectedGraduation: "2050"
    });


    const exampleQuiz: TrainingModuleItem[] = [{
      id: '6784b67f-10d0-4476-8a81-e30c5f537e4e',
      type: 'TEXT',
      text: 'example'
    }]

    // Create module
    const moduleID = (await ModuleRepo.addModule("Test Module", exampleQuiz)).id;

    // Add module to equipment
    await EquipmentRepo.addModulesToEquipment(equipmentID, [moduleID]);

    expect(await EquipmentRepo.hasAccessByID(userID, equipmentID)).toBe(false);
  });

});
